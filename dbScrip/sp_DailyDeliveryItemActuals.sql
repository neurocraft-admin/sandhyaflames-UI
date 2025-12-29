-- =============================================
-- Daily Delivery Item-Level Actuals Tracking
-- Track actual delivery quantities for each product
-- =============================================

USE [sandhyaflames]
GO

-- =============================================
-- 1. Create DailyDeliveryItemActuals Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DailyDeliveryItemActuals]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DailyDeliveryItemActuals](
        [ActualId] [int] IDENTITY(1,1) NOT NULL,
        [DeliveryId] [int] NOT NULL,
        [ProductId] [int] NOT NULL,
        [PlannedQuantity] [int] NOT NULL,
        [DeliveredQuantity] [int] NOT NULL DEFAULT 0,
        [PendingQuantity] [int] NOT NULL DEFAULT 0,
        [CashCollected] [decimal](18, 2) NULL DEFAULT 0,
        [ItemStatus] [nvarchar](20) NOT NULL DEFAULT 'Pending',  -- 'Completed', 'Partial', 'Pending'
        [Remarks] [nvarchar](500) NULL,
        [UpdatedAt] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_DailyDeliveryItemActuals] PRIMARY KEY CLUSTERED ([ActualId] ASC),
        CONSTRAINT [FK_Actuals_DailyDelivery] FOREIGN KEY ([DeliveryId]) REFERENCES [dbo].[DailyDelivery]([DeliveryId]) ON DELETE CASCADE,
        CONSTRAINT [FK_Actuals_Products] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([ProductId]),
        CONSTRAINT [UQ_DeliveryProduct] UNIQUE ([DeliveryId], [ProductId])  -- One record per delivery-product combination
    )

    CREATE NONCLUSTERED INDEX [IX_Actuals_DeliveryId] ON [dbo].[DailyDeliveryItemActuals]([DeliveryId])
    CREATE NONCLUSTERED INDEX [IX_Actuals_ProductId] ON [dbo].[DailyDeliveryItemActuals]([ProductId])
    CREATE NONCLUSTERED INDEX [IX_Actuals_Status] ON [dbo].[DailyDeliveryItemActuals]([ItemStatus])
END
GO

-- =============================================
-- 2. SP: Get Item-Level Actuals for a Delivery
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetDeliveryItemActuals]
    @DeliveryId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.ActualId,
        a.DeliveryId,
        a.ProductId,
        p.ProductName,
        ISNULL(sc.SubCategoryName, c.CategoryName) AS CategoryName,
        a.PlannedQuantity,
        a.DeliveredQuantity,
        a.PendingQuantity,
        a.CashCollected,
        a.ItemStatus,
        a.Remarks,
        a.UpdatedAt,
        di.SellingPriceAtDelivery AS UnitPrice,
        (a.DeliveredQuantity * di.SellingPriceAtDelivery) AS TotalAmount
    FROM dbo.DailyDeliveryItemActuals a
    INNER JOIN dbo.Products p ON a.ProductId = p.ProductId
    INNER JOIN dbo.DailyDeliveryItems di ON a.DeliveryId = di.DeliveryId AND a.ProductId = di.ProductId
    LEFT JOIN dbo.ProductCategories c ON p.CategoryId = c.CategoryId
    LEFT JOIN dbo.ProductSubCategories sc ON p.SubCategoryId = sc.SubCategoryId
    WHERE a.DeliveryId = @DeliveryId
    ORDER BY p.ProductName;
END
GO

-- =============================================
-- 3. SP: Initialize Item Actuals from Planned Items
-- Called when delivery is created or when first updating actuals
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_InitializeDeliveryItemActuals]
    @DeliveryId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert actuals for all delivery items that don't have actuals yet
    INSERT INTO dbo.DailyDeliveryItemActuals (
        DeliveryId,
        ProductId,
        PlannedQuantity,
        DeliveredQuantity,
        PendingQuantity,
        CashCollected,
        ItemStatus,
        UpdatedAt
    )
    SELECT 
        di.DeliveryId,
        di.ProductId,
        di.NoOfCylinders,
        0,  -- Initially 0 delivered
        di.NoOfCylinders,  -- All pending initially
        0,  -- No cash collected yet
        'Pending',
        GETDATE()
    FROM dbo.DailyDeliveryItems di
    WHERE di.DeliveryId = @DeliveryId
    AND NOT EXISTS (
        SELECT 1 FROM dbo.DailyDeliveryItemActuals a 
        WHERE a.DeliveryId = di.DeliveryId AND a.ProductId = di.ProductId
    );
    
    SELECT 1 AS success, 'Item actuals initialized' AS message;
END
GO

-- =============================================
-- 4. SP: Update Item-Level Actuals (Bulk Update)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_UpdateDeliveryItemActuals]
    @DeliveryId INT,
    @ItemsJson NVARCHAR(MAX)  -- JSON array of item actuals
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate delivery exists
        IF NOT EXISTS (SELECT 1 FROM dbo.DailyDelivery WHERE DeliveryId = @DeliveryId)
        BEGIN
            RAISERROR('Delivery not found', 16, 1);
            RETURN;
        END

        -- Parse JSON input
        -- Expected format: [{"productId":1,"delivered":8,"pending":2,"cashCollected":4000,"remarks":""}]
        DECLARE @ItemsTable TABLE (
            ProductId INT,
            DeliveredQuantity INT,
            PendingQuantity INT,
            CashCollected DECIMAL(18,2),
            Remarks NVARCHAR(500)
        );

        INSERT INTO @ItemsTable (ProductId, DeliveredQuantity, PendingQuantity, CashCollected, Remarks)
        SELECT 
            ProductId,
            DeliveredQuantity,
            PendingQuantity,
            ISNULL(CashCollected, 0),
            Remarks
        FROM OPENJSON(@ItemsJson)
        WITH (
            ProductId INT '$.productId',
            DeliveredQuantity INT '$.delivered',
            PendingQuantity INT '$.pending',
            CashCollected DECIMAL(18,2) '$.cashCollected',
            Remarks NVARCHAR(500) '$.remarks'
        );

        -- Update or insert actuals for each item
        MERGE dbo.DailyDeliveryItemActuals AS target
        USING (
            SELECT 
                @DeliveryId AS DeliveryId,
                t.ProductId,
                di.NoOfCylinders AS PlannedQuantity,
                t.DeliveredQuantity,
                t.PendingQuantity,
                t.CashCollected,
                t.Remarks,
                CASE 
                    WHEN t.PendingQuantity = 0 THEN 'Completed'
                    WHEN t.DeliveredQuantity > 0 THEN 'Partial'
                    ELSE 'Pending'
                END AS ItemStatus
            FROM @ItemsTable t
            INNER JOIN dbo.DailyDeliveryItems di ON di.DeliveryId = @DeliveryId AND di.ProductId = t.ProductId
        ) AS source
        ON target.DeliveryId = source.DeliveryId AND target.ProductId = source.ProductId
        WHEN MATCHED THEN
            UPDATE SET
                DeliveredQuantity = source.DeliveredQuantity,
                PendingQuantity = source.PendingQuantity,
                CashCollected = source.CashCollected,
                ItemStatus = source.ItemStatus,
                Remarks = source.Remarks,
                UpdatedAt = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (DeliveryId, ProductId, PlannedQuantity, DeliveredQuantity, PendingQuantity, CashCollected, ItemStatus, Remarks, UpdatedAt)
            VALUES (source.DeliveryId, source.ProductId, source.PlannedQuantity, source.DeliveredQuantity, 
                    source.PendingQuantity, source.CashCollected, source.ItemStatus, source.Remarks, GETDATE());

        -- Note: DailyDelivery table doesn't have aggregate columns
        -- Aggregates are calculated on-demand from DailyDeliveryItemActuals

        SELECT 1 AS success, 'Item actuals updated successfully' AS message;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

-- =============================================
-- 5. SP: Get Delivery Summary with Item-Level Details
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetDeliveryWithItemActuals]
    @DeliveryId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Delivery header
    SELECT 
        dd.DeliveryId,
        dd.DeliveryDate,
        dd.VehicleId,
        v.VehicleNumber,
        dd.Status,
        dd.ReturnTime,
        dd.Remarks,
        -- Calculated aggregates from actuals
        (SELECT COUNT(*) FROM dbo.DailyDeliveryItemActuals WHERE DeliveryId = @DeliveryId AND ItemStatus = 'Completed') AS CompletedInvoices,
        (SELECT COUNT(*) FROM dbo.DailyDeliveryItemActuals WHERE DeliveryId = @DeliveryId AND ItemStatus IN ('Pending', 'Partial')) AS PendingInvoices,
        (SELECT ISNULL(SUM(CashCollected), 0) FROM dbo.DailyDeliveryItemActuals WHERE DeliveryId = @DeliveryId) AS CashCollected,
        0 AS EmptyCylindersReturned  -- Not tracked in current schema
    FROM dbo.DailyDelivery dd
    LEFT JOIN dbo.Vehicles v ON dd.VehicleId = v.VehicleId
    WHERE dd.DeliveryId = @DeliveryId;

    -- Item-level actuals
    EXEC sp_GetDeliveryItemActuals @DeliveryId = @DeliveryId;
END
GO

-- =============================================
-- 6. SP: Close Delivery with Item Verification
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_CloseDeliveryWithItemActuals]
    @DeliveryId INT,
    @ReturnTime TIME,
    @EmptyCylindersReturned INT,
    @Remarks NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate delivery exists
        IF NOT EXISTS (SELECT 1 FROM dbo.DailyDelivery WHERE DeliveryId = @DeliveryId)
        BEGIN
            RAISERROR('Delivery not found', 16, 1);
            RETURN;
        END

        -- Check if delivery is already closed
        IF EXISTS (SELECT 1 FROM dbo.DailyDelivery WHERE DeliveryId = @DeliveryId AND Status = 'Closed')
        BEGIN
            RAISERROR('Delivery is already closed', 16, 1);
            RETURN;
        END

        -- Update delivery status
        UPDATE dbo.DailyDelivery
        SET 
            Status = 'Closed',
            ReturnTime = @ReturnTime,
            Remarks = ISNULL(@Remarks, Remarks)
            -- Note: EmptyCylindersReturned, CompletedInvoices, PendingInvoices, CashCollected 
            -- are not stored in DailyDelivery table - calculated on-demand from actuals
        WHERE DeliveryId = @DeliveryId;

        SELECT 1 AS success, 'Delivery closed successfully' AS message;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

PRINT 'Daily Delivery Item Actuals tracking created successfully!'
