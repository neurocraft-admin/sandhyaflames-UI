-- =============================================
-- STOCK REGISTER MANAGEMENT SYSTEM
-- Track inventory of filled, empty, and damaged cylinders
-- Auto-integrate with Purchase Entry and Daily Delivery
-- =============================================

USE [sandhyaflames]
GO

-- =============================================
-- 1. CREATE STOCK REGISTER TABLE
-- Stores current stock levels for each product
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[StockRegister]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[StockRegister](
        [StockId] [int] IDENTITY(1,1) NOT NULL,
        [ProductId] [int] NOT NULL,
        [FilledStock] [int] NOT NULL DEFAULT 0,
        [EmptyStock] [int] NOT NULL DEFAULT 0,
        [DamagedStock] [int] NOT NULL DEFAULT 0,
        [LastUpdated] [datetime] NOT NULL DEFAULT GETDATE(),
        [UpdatedBy] [nvarchar](100) NULL,
        CONSTRAINT [PK_StockRegister] PRIMARY KEY CLUSTERED ([StockId] ASC),
        CONSTRAINT [FK_StockRegister_Products] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([ProductId]),
        CONSTRAINT [UQ_StockRegister_ProductId] UNIQUE ([ProductId])  -- One record per product
    )

    CREATE NONCLUSTERED INDEX [IX_StockRegister_ProductId] ON [dbo].[StockRegister]([ProductId])
END
GO

-- =============================================
-- 2. CREATE STOCK TRANSACTIONS TABLE (Audit Trail)
-- Tracks all stock movements for history/reporting
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[StockTransactions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[StockTransactions](
        [TransactionId] [int] IDENTITY(1,1) NOT NULL,
        [ProductId] [int] NOT NULL,
        [TransactionType] [nvarchar](50) NOT NULL,  -- 'Purchase', 'DeliveryAssigned', 'DeliveryCompleted', 'EmptyReturn', 'Damaged', 'Adjustment'
        [FilledChange] [int] NOT NULL DEFAULT 0,    -- Positive = increase, Negative = decrease
        [EmptyChange] [int] NOT NULL DEFAULT 0,
        [DamagedChange] [int] NOT NULL DEFAULT 0,
        [ReferenceId] [int] NULL,                   -- DeliveryId, PurchaseId, etc.
        [ReferenceType] [nvarchar](50) NULL,        -- 'Delivery', 'Purchase', 'Manual'
        [Remarks] [nvarchar](500) NULL,
        [TransactionDate] [datetime] NOT NULL DEFAULT GETDATE(),
        [CreatedBy] [nvarchar](100) NULL,
        CONSTRAINT [PK_StockTransactions] PRIMARY KEY CLUSTERED ([TransactionId] ASC),
        CONSTRAINT [FK_StockTransactions_Products] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([ProductId])
    )

    CREATE NONCLUSTERED INDEX [IX_StockTransactions_ProductId] ON [dbo].[StockTransactions]([ProductId])
    CREATE NONCLUSTERED INDEX [IX_StockTransactions_Date] ON [dbo].[StockTransactions]([TransactionDate])
    CREATE NONCLUSTERED INDEX [IX_StockTransactions_Reference] ON [dbo].[StockTransactions]([ReferenceId], [ReferenceType])
END
GO

-- =============================================
-- 3. SP: GET STOCK REGISTER (WITH FILTERS)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetStockRegister]
    @ProductId INT = NULL,
    @CategoryId INT = NULL,
    @SubCategoryId INT = NULL,
    @SearchTerm NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        sr.StockId,
        sr.ProductId,
        p.ProductName,
        c.CategoryName,
        ISNULL(sc.SubCategoryName, c.CategoryName) AS SubCategoryName,
        sr.FilledStock,
        sr.EmptyStock,
        sr.DamagedStock,
        (sr.FilledStock + sr.EmptyStock + sr.DamagedStock) AS TotalStock,
        sr.LastUpdated,
        sr.UpdatedBy
    FROM dbo.StockRegister sr
    INNER JOIN dbo.Products p ON sr.ProductId = p.ProductId
    LEFT JOIN dbo.ProductCategories c ON p.CategoryId = c.CategoryId
    LEFT JOIN dbo.ProductSubCategories sc ON p.SubCategoryId = sc.SubCategoryId
    WHERE 
        (@ProductId IS NULL OR sr.ProductId = @ProductId)
        AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
        AND (@SubCategoryId IS NULL OR p.SubCategoryId = @SubCategoryId)
        AND (@SearchTerm IS NULL OR 
             p.ProductName LIKE '%' + @SearchTerm + '%' OR
             c.CategoryName LIKE '%' + @SearchTerm + '%' OR
             sc.SubCategoryName LIKE '%' + @SearchTerm + '%')
    ORDER BY p.ProductName;
END
GO

-- =============================================
-- 4. SP: GET CONSOLIDATED STOCK SUMMARY
-- Aggregate by category/subcategory
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetStockSummary]
    @GroupBy NVARCHAR(20) = 'Product'  -- 'Product', 'Category', 'SubCategory'
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @GroupBy = 'Category'
    BEGIN
        SELECT 
            c.CategoryId,
            c.CategoryName AS GroupName,
            SUM(sr.FilledStock) AS FilledStock,
            SUM(sr.EmptyStock) AS EmptyStock,
            SUM(sr.DamagedStock) AS DamagedStock,
            SUM(sr.FilledStock + sr.EmptyStock + sr.DamagedStock) AS TotalStock,
            COUNT(DISTINCT sr.ProductId) AS ProductCount
        FROM dbo.StockRegister sr
        INNER JOIN dbo.Products p ON sr.ProductId = p.ProductId
        INNER JOIN dbo.ProductCategories c ON p.CategoryId = c.CategoryId
        GROUP BY c.CategoryId, c.CategoryName
        ORDER BY c.CategoryName;
    END
    ELSE IF @GroupBy = 'SubCategory'
    BEGIN
        SELECT 
            ISNULL(sc.SubCategoryId, p.CategoryId) AS GroupId,
            ISNULL(sc.SubCategoryName, c.CategoryName) AS GroupName,
            SUM(sr.FilledStock) AS FilledStock,
            SUM(sr.EmptyStock) AS EmptyStock,
            SUM(sr.DamagedStock) AS DamagedStock,
            SUM(sr.FilledStock + sr.EmptyStock + sr.DamagedStock) AS TotalStock,
            COUNT(DISTINCT sr.ProductId) AS ProductCount
        FROM dbo.StockRegister sr
        INNER JOIN dbo.Products p ON sr.ProductId = p.ProductId
        LEFT JOIN dbo.ProductCategories c ON p.CategoryId = c.CategoryId
        LEFT JOIN dbo.ProductSubCategories sc ON p.SubCategoryId = sc.SubCategoryId
        GROUP BY ISNULL(sc.SubCategoryId, p.CategoryId), ISNULL(sc.SubCategoryName, c.CategoryName)
        ORDER BY GroupName;
    END
    ELSE  -- Product level (default)
    BEGIN
        EXEC sp_GetStockRegister;
    END
END
GO

-- =============================================
-- 5. SP: UPDATE STOCK FROM PURCHASE ENTRY
-- Called when new purchase is recorded
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_UpdateStockFromPurchase]
    @PurchaseId INT,
    @ProductId INT,
    @Quantity INT,
    @Remarks NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Upsert stock register
        MERGE INTO dbo.StockRegister AS target
        USING (SELECT @ProductId AS ProductId, @Quantity AS Quantity) AS source
        ON target.ProductId = source.ProductId
        WHEN MATCHED THEN
            UPDATE SET 
                FilledStock = FilledStock + source.Quantity,
                LastUpdated = GETDATE(),
                UpdatedBy = 'PurchaseEntry'
        WHEN NOT MATCHED THEN
            INSERT (ProductId, FilledStock, EmptyStock, DamagedStock, LastUpdated, UpdatedBy)
            VALUES (source.ProductId, source.Quantity, 0, 0, GETDATE(), 'PurchaseEntry');

        -- Record transaction
        INSERT INTO dbo.StockTransactions (ProductId, TransactionType, FilledChange, EmptyChange, DamagedChange, ReferenceId, ReferenceType, Remarks, CreatedBy)
        VALUES (@ProductId, 'Purchase', @Quantity, 0, 0, @PurchaseId, 'Purchase', @Remarks, 'PurchaseEntry');

        SELECT 1 AS success, 'Stock updated from purchase' AS message;

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
-- 6. SP: UPDATE STOCK FROM DELIVERY ASSIGNMENT
-- Called when delivery is created and items assigned to vehicle
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_UpdateStockFromDeliveryAssignment]
    @DeliveryId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Deduct filled stock for each delivery item
        DECLARE @ProductId INT, @Quantity INT;
        
        DECLARE item_cursor CURSOR FOR
        SELECT ProductId, NoOfCylinders 
        FROM dbo.DailyDeliveryItems 
        WHERE DeliveryId = @DeliveryId;

        OPEN item_cursor;
        FETCH NEXT FROM item_cursor INTO @ProductId, @Quantity;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Update stock register (deduct from filled)
            UPDATE dbo.StockRegister
            SET 
                FilledStock = FilledStock - @Quantity,
                LastUpdated = GETDATE(),
                UpdatedBy = 'DeliveryAssignment'
            WHERE ProductId = @ProductId;

            -- Record transaction
            INSERT INTO dbo.StockTransactions (ProductId, TransactionType, FilledChange, EmptyChange, DamagedChange, ReferenceId, ReferenceType, Remarks, CreatedBy)
            VALUES (@ProductId, 'DeliveryAssigned', -@Quantity, 0, 0, @DeliveryId, 'Delivery', 'Assigned to vehicle', 'System');

            FETCH NEXT FROM item_cursor INTO @ProductId, @Quantity;
        END

        CLOSE item_cursor;
        DEALLOCATE item_cursor;

        SELECT 1 AS success, 'Stock updated for delivery assignment' AS message;

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
-- 7. SP: UPDATE STOCK FROM DELIVERY COMPLETION
-- Called when delivery returns with empty/damaged cylinders
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_UpdateStockFromDeliveryReturn]
    @DeliveryId INT,
    @EmptyCylindersReturned INT,
    @DamagedCylinders INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Get primary product from delivery (assuming first item or most common)
        DECLARE @ProductId INT;
        SELECT TOP 1 @ProductId = ProductId 
        FROM dbo.DailyDeliveryItems 
        WHERE DeliveryId = @DeliveryId
        ORDER BY NoOfCylinders DESC;

        IF @ProductId IS NOT NULL
        BEGIN
            -- Update stock register (add to empty and damaged)
            UPDATE dbo.StockRegister
            SET 
                EmptyStock = EmptyStock + @EmptyCylindersReturned,
                DamagedStock = DamagedStock + @DamagedCylinders,
                LastUpdated = GETDATE(),
                UpdatedBy = 'DeliveryReturn'
            WHERE ProductId = @ProductId;

            -- Record transaction for empties
            IF @EmptyCylindersReturned > 0
            BEGIN
                INSERT INTO dbo.StockTransactions (ProductId, TransactionType, FilledChange, EmptyChange, DamagedChange, ReferenceId, ReferenceType, Remarks, CreatedBy)
                VALUES (@ProductId, 'EmptyReturn', 0, @EmptyCylindersReturned, 0, @DeliveryId, 'Delivery', 'Empty cylinders returned', 'System');
            END

            -- Record transaction for damaged
            IF @DamagedCylinders > 0
            BEGIN
                INSERT INTO dbo.StockTransactions (ProductId, TransactionType, FilledChange, EmptyChange, DamagedChange, ReferenceId, ReferenceType, Remarks, CreatedBy)
                VALUES (@ProductId, 'Damaged', 0, 0, @DamagedCylinders, @DeliveryId, 'Delivery', 'Damaged cylinders reported', 'System');
            END
        END

        SELECT 1 AS success, 'Stock updated for delivery return' AS message;

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
-- 8. SP: MANUAL STOCK ADJUSTMENT
-- For corrections, refills, transfers, etc.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_AdjustStock]
    @ProductId INT,
    @FilledChange INT = 0,
    @EmptyChange INT = 0,
    @DamagedChange INT = 0,
    @Remarks NVARCHAR(500) = NULL,
    @AdjustedBy NVARCHAR(100) = 'Admin'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate product exists
        IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE ProductId = @ProductId)
        BEGIN
            RAISERROR('Product not found', 16, 1);
            RETURN;
        END

        -- Upsert stock register
        MERGE INTO dbo.StockRegister AS target
        USING (SELECT @ProductId AS ProductId) AS source
        ON target.ProductId = source.ProductId
        WHEN MATCHED THEN
            UPDATE SET 
                FilledStock = FilledStock + @FilledChange,
                EmptyStock = EmptyStock + @EmptyChange,
                DamagedStock = DamagedStock + @DamagedChange,
                LastUpdated = GETDATE(),
                UpdatedBy = @AdjustedBy
        WHEN NOT MATCHED THEN
            INSERT (ProductId, FilledStock, EmptyStock, DamagedStock, LastUpdated, UpdatedBy)
            VALUES (source.ProductId, @FilledChange, @EmptyChange, @DamagedChange, GETDATE(), @AdjustedBy);

        -- Record transaction
        INSERT INTO dbo.StockTransactions (ProductId, TransactionType, FilledChange, EmptyChange, DamagedChange, ReferenceId, ReferenceType, Remarks, CreatedBy)
        VALUES (@ProductId, 'Adjustment', @FilledChange, @EmptyChange, @DamagedChange, NULL, 'Manual', @Remarks, @AdjustedBy);

        SELECT 1 AS success, 'Stock adjusted successfully' AS message;

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
-- 9. SP: GET STOCK TRANSACTION HISTORY
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetStockTransactionHistory]
    @ProductId INT = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL,
    @TransactionType NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        st.TransactionId,
        st.ProductId,
        p.ProductName,
        st.TransactionType,
        st.FilledChange,
        st.EmptyChange,
        st.DamagedChange,
        st.ReferenceId,
        st.ReferenceType,
        st.Remarks,
        st.TransactionDate,
        st.CreatedBy
    FROM dbo.StockTransactions st
    INNER JOIN dbo.Products p ON st.ProductId = p.ProductId
    WHERE 
        (@ProductId IS NULL OR st.ProductId = @ProductId)
        AND (@FromDate IS NULL OR st.TransactionDate >= @FromDate)
        AND (@ToDate IS NULL OR st.TransactionDate <= @ToDate)
        AND (@TransactionType IS NULL OR st.TransactionType = @TransactionType)
    ORDER BY st.TransactionDate DESC, st.TransactionId DESC;
END
GO

-- =============================================
-- 10. INITIALIZE STOCK FOR EXISTING PRODUCTS
-- Run this once to create stock records for all products
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_InitializeStockRegister]
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.StockRegister (ProductId, FilledStock, EmptyStock, DamagedStock, LastUpdated, UpdatedBy)
    SELECT 
        p.ProductId,
        0,  -- Start with 0, will be updated from purchases
        0,
        0,
        GETDATE(),
        'Initialization'
    FROM dbo.Products p
    WHERE NOT EXISTS (SELECT 1 FROM dbo.StockRegister sr WHERE sr.ProductId = p.ProductId);
    
    SELECT @@ROWCOUNT AS InitializedCount;
END
GO

PRINT 'Stock Register system created successfully!'
PRINT 'Run sp_InitializeStockRegister to create initial stock records for all products.'
