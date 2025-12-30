USE [sandhyaflames]
GO

-- =============================================
-- UPDATED STORED PROCEDURES
-- Support for EmptyReturned and DamagedReturned
-- =============================================

-- =============================================
-- 1. sp_GetDeliveryItemActuals - Include new columns
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
        a.EmptyReturned,
        a.DamagedReturned,
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

PRINT '✅ Updated sp_GetDeliveryItemActuals';
GO

-- =============================================
-- 2. sp_UpdateDeliveryItemActuals - Accept new columns
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_UpdateDeliveryItemActuals]
    @DeliveryId INT,
    @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Parse JSON with new columns
        -- Expected: [{"productId":1,"delivered":48,"pending":2,"emptyReturned":45,"damagedReturned":3,"cashCollected":24000}]
        DECLARE @ItemsTable TABLE (
            ProductId INT,
            DeliveredQuantity INT,
            PendingQuantity INT,
            EmptyReturned INT,
            DamagedReturned INT,
            CashCollected DECIMAL(18,2),
            Remarks NVARCHAR(500)
        );

        INSERT INTO @ItemsTable
        SELECT 
            ProductId,
            DeliveredQuantity,
            PendingQuantity,
            ISNULL(EmptyReturned, 0),
            ISNULL(DamagedReturned, 0),
            ISNULL(CashCollected, 0),
            Remarks
        FROM OPENJSON(@ItemsJson)
        WITH (
            ProductId INT,
            DeliveredQuantity INT,
            PendingQuantity INT,
            EmptyReturned INT,
            DamagedReturned INT,
            CashCollected DECIMAL(18,2),
            Remarks NVARCHAR(500)
        );

        -- Update actuals
        UPDATE a
        SET 
            DeliveredQuantity = t.DeliveredQuantity,
            PendingQuantity = t.PendingQuantity,
            EmptyReturned = t.EmptyReturned,
            DamagedReturned = t.DamagedReturned,
            CashCollected = t.CashCollected,
            Remarks = t.Remarks,
            ItemStatus = CASE 
                WHEN t.DeliveredQuantity = a.PlannedQuantity THEN 'Completed'
                WHEN t.DeliveredQuantity > 0 THEN 'Partial'
                ELSE 'Pending'
            END,
            UpdatedAt = GETDATE()
        FROM dbo.DailyDeliveryItemActuals a
        INNER JOIN @ItemsTable t ON a.ProductId = t.ProductId
        WHERE a.DeliveryId = @DeliveryId;

        SELECT 1 AS success, 'Item actuals updated successfully' AS message;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 0 AS success, ERROR_MESSAGE() AS message;
    END CATCH
END
GO

PRINT '✅ Updated sp_UpdateDeliveryItemActuals';
GO

-- =============================================
-- 3. sp_UpdateStockFromDeliveryReturn - Use product-level returns
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_UpdateStockFromDeliveryReturn]
    @DeliveryId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Process each product's returns separately
        INSERT INTO StockTransactions (
            ProductId, 
            TransactionType, 
            FilledChange, 
            EmptyChange, 
            DamagedChange, 
            ReferenceId, 
            ReferenceType, 
            Remarks, 
            CreatedBy
        )
        SELECT 
            a.ProductId,
            'DeliveryReturn',
            0,  -- No change to filled stock
            a.EmptyReturned,    -- Product-specific empty returns
            a.DamagedReturned,  -- Product-specific damaged returns
            a.DeliveryId,
            'Delivery',
            'Delivery #' + CAST(a.DeliveryId AS NVARCHAR(10)) + ' - ' + p.ProductName + ' returns',
            'System'
        FROM DailyDeliveryItemActuals a
        INNER JOIN Products p ON a.ProductId = p.ProductId
        WHERE a.DeliveryId = @DeliveryId
        AND (a.EmptyReturned > 0 OR a.DamagedReturned > 0);  -- Only if there are returns

        -- Update stock register per product
        UPDATE sr
        SET 
            EmptyStock = sr.EmptyStock + a.EmptyReturned,
            DamagedStock = sr.DamagedStock + a.DamagedReturned,
            LastUpdated = GETDATE(),
            UpdatedBy = 'DeliveryReturn'
        FROM StockRegister sr
        INNER JOIN DailyDeliveryItemActuals a ON sr.ProductId = a.ProductId
        WHERE a.DeliveryId = @DeliveryId
        AND (a.EmptyReturned > 0 OR a.DamagedReturned > 0);

        DECLARE @EmptyCount INT = (SELECT SUM(EmptyReturned) FROM DailyDeliveryItemActuals WHERE DeliveryId = @DeliveryId);
        DECLARE @DamagedCount INT = (SELECT SUM(DamagedReturned) FROM DailyDeliveryItemActuals WHERE DeliveryId = @DeliveryId);

        SELECT 
            1 AS success, 
            'Stock updated: ' + CAST(ISNULL(@EmptyCount,0) AS NVARCHAR(10)) + ' empty, ' + 
            CAST(ISNULL(@DamagedCount,0) AS NVARCHAR(10)) + ' damaged returned' AS message;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 0 AS success, ERROR_MESSAGE() AS message;
    END CATCH
END
GO

PRINT '✅ Updated sp_UpdateStockFromDeliveryReturn';
GO

PRINT '';
PRINT '========================================';
PRINT 'All stored procedures updated!';
PRINT '========================================';
