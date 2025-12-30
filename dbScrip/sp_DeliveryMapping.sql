-- =============================================
-- Daily Delivery Customer Mapping (Commercial Cylinders)
-- =============================================

USE [sandhyaflames]
GO

-- =============================================
-- 1. Create DailyDeliveryCustomerMapping Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DailyDeliveryCustomerMapping]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DailyDeliveryCustomerMapping](
        [MappingId] [int] IDENTITY(1,1) NOT NULL,
        [DeliveryId] [int] NOT NULL,
        [ProductId] [int] NOT NULL,
        [CustomerId] [int] NOT NULL,
        [Quantity] [int] NOT NULL,
        [SellingPrice] [decimal](18, 2) NOT NULL,
        [TotalAmount] [decimal](18, 2) NOT NULL,
        [IsCreditSale] [bit] NOT NULL DEFAULT 0,
        [PaymentMode] [nvarchar](20) NOT NULL DEFAULT 'Cash',
        [InvoiceNumber] [nvarchar](50) NULL,
        [Remarks] [nvarchar](500) NULL,
        [CreatedAt] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_DailyDeliveryCustomerMapping] PRIMARY KEY CLUSTERED ([MappingId] ASC),
        CONSTRAINT [FK_Mapping_DailyDelivery] FOREIGN KEY ([DeliveryId]) REFERENCES [dbo].[DailyDelivery]([DeliveryId]),
        CONSTRAINT [FK_Mapping_Products] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([ProductId]),
        CONSTRAINT [FK_Mapping_Customers] FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customers]([CustomerId])
    )

    CREATE NONCLUSTERED INDEX [IX_Mapping_DeliveryId] ON [dbo].[DailyDeliveryCustomerMapping]([DeliveryId])
    CREATE NONCLUSTERED INDEX [IX_Mapping_CustomerId] ON [dbo].[DailyDeliveryCustomerMapping]([CustomerId])
    CREATE NONCLUSTERED INDEX [IX_Mapping_ProductId] ON [dbo].[DailyDeliveryCustomerMapping]([ProductId])
END
GO

-- =============================================
-- 2. SP: Get Commercial Items for a Delivery
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetCommercialItemsByDelivery]
    @DeliveryId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        di.DeliveryId,
        di.ProductId,
        p.ProductName,
        ISNULL(sc.SubCategoryName, c.CategoryName) AS CategoryName,
        di.NoOfCylinders,
        di.NoOfInvoices,
        di.NoOfDeliveries,
        ISNULL(SUM(m.Quantity), 0) AS MappedQuantity,
        di.NoOfCylinders - ISNULL(SUM(m.Quantity), 0) AS RemainingQuantity,
        di.SellingPriceAtDelivery AS SellingPrice
    FROM dbo.DailyDeliveryItems di
    INNER JOIN dbo.Products p ON di.ProductId = p.ProductId
    INNER JOIN dbo.ProductCategories c ON p.CategoryId = c.CategoryId
    LEFT JOIN dbo.ProductSubCategories sc ON p.SubCategoryId = sc.SubCategoryId
    LEFT JOIN dbo.DailyDeliveryCustomerMapping m ON di.DeliveryId = m.DeliveryId AND di.ProductId = m.ProductId
    WHERE di.DeliveryId = @DeliveryId
    GROUP BY 
        di.DeliveryId,
        di.ProductId,
        p.ProductName,
        c.CategoryName,
        sc.SubCategoryName,
        di.NoOfCylinders,
        di.NoOfInvoices,
        di.NoOfDeliveries,
        di.SellingPriceAtDelivery
    ORDER BY p.ProductName;
END
GO

-- =============================================
-- 3. SP: Get Mappings by Delivery
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetMappingsByDelivery]
    @DeliveryId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        m.MappingId,
        m.DeliveryId,
        m.ProductId,
        p.ProductName,
        m.CustomerId,
        c.CustomerName,
        m.Quantity,
        m.SellingPrice,
        m.TotalAmount,
        m.IsCreditSale,
        m.PaymentMode,
        m.InvoiceNumber,
        m.Remarks,
        m.CreatedAt
    FROM dbo.DailyDeliveryCustomerMapping m
    INNER JOIN dbo.Products p ON m.ProductId = p.ProductId
    INNER JOIN dbo.Customers c ON m.CustomerId = c.CustomerId
    WHERE m.DeliveryId = @DeliveryId
    ORDER BY m.MappingId DESC;
END
GO

-- =============================================
-- 4. SP: Get Delivery Mapping Summary
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetDeliveryMappingSummary]
    @DeliveryId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        dd.DeliveryId,
        dd.DeliveryDate,
        d.FullName AS DriverName,
        v.VehicleNumber AS VehicleNo,
        ISNULL(SUM(di.NoOfCylinders), 0) AS TotalCommercialCylinders,
        ISNULL(SUM(m.MappedQty), 0) AS MappedCylinders,
        ISNULL(SUM(di.NoOfCylinders), 0) - ISNULL(SUM(m.MappedQty), 0) AS UnmappedCylinders
    FROM dbo.DailyDelivery dd
    LEFT JOIN dbo.DailyDeliveryDrivers ddd ON dd.DeliveryId = ddd.DeliveryId
    LEFT JOIN dbo.Drivers d ON ddd.DriverId = d.DriverId
    LEFT JOIN dbo.Vehicles v ON dd.VehicleId = v.VehicleId
    LEFT JOIN dbo.DailyDeliveryItems di ON dd.DeliveryId = di.DeliveryId
    LEFT JOIN dbo.Products p ON di.ProductId = p.ProductId
    LEFT JOIN dbo.ProductCategories c ON p.CategoryId = c.CategoryId
    LEFT JOIN dbo.ProductSubCategories sc ON p.SubCategoryId = sc.SubCategoryId
    LEFT JOIN (
        SELECT DeliveryId, ProductId, SUM(Quantity) AS MappedQty
        FROM dbo.DailyDeliveryCustomerMapping
        GROUP BY DeliveryId, ProductId
    ) m ON di.DeliveryId = m.DeliveryId AND di.ProductId = m.ProductId
    WHERE dd.DeliveryId = @DeliveryId
    GROUP BY 
        dd.DeliveryId,
        dd.DeliveryDate,
        d.FullName,
        v.VehicleNumber;
END
GO

-- =============================================
-- 5. SP: Create Customer Mapping
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_CreateCustomerMapping]
    @DeliveryId INT,
    @ProductId INT,
    @CustomerId INT,
    @Quantity INT,
    @IsCreditSale BIT,
    @PaymentMode NVARCHAR(20),
    @InvoiceNumber NVARCHAR(50) = NULL,
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

        -- Validate delivery item exists for this product
        IF NOT EXISTS (SELECT 1 FROM dbo.DailyDeliveryItems WHERE DeliveryId = @DeliveryId AND ProductId = @ProductId)
        BEGIN
            RAISERROR('Product not found in this delivery', 16, 1);
            RETURN;
        END

        -- Validate customer exists
        IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId = @CustomerId)
        BEGIN
            RAISERROR('Customer not found', 16, 1);
            RETURN;
        END

        -- Get selling price and total cylinders
        DECLARE @SellingPrice DECIMAL(18, 2);
        DECLARE @TotalCylinders INT;
        DECLARE @MappedQuantity INT;

        SELECT 
            @SellingPrice = SellingPriceAtDelivery,
            @TotalCylinders = NoOfCylinders
        FROM dbo.DailyDeliveryItems
        WHERE DeliveryId = @DeliveryId AND ProductId = @ProductId;

        -- Get already mapped quantity
        SELECT @MappedQuantity = ISNULL(SUM(Quantity), 0)
        FROM dbo.DailyDeliveryCustomerMapping
        WHERE DeliveryId = @DeliveryId AND ProductId = @ProductId;

        -- Validate quantity
        IF (@MappedQuantity + @Quantity) > @TotalCylinders
        BEGIN
            RAISERROR('Quantity exceeds available cylinders', 16, 1);
            RETURN;
        END

        -- Calculate total amount
        DECLARE @TotalAmount DECIMAL(18, 2) = @SellingPrice * @Quantity;

        -- Insert mapping
        INSERT INTO dbo.DailyDeliveryCustomerMapping (
            DeliveryId,
            ProductId,
            CustomerId,
            Quantity,
            SellingPrice,
            TotalAmount,
            IsCreditSale,
            PaymentMode,
            InvoiceNumber,
            Remarks,
            CreatedAt
        )
        VALUES (
            @DeliveryId,
            @ProductId,
            @CustomerId,
            @Quantity,
            @SellingPrice,
            @TotalAmount,
            @IsCreditSale,
            @PaymentMode,
            @InvoiceNumber,
            @Remarks,
            GETDATE()
        );

        -- If credit sale, add to customer credit usage
        IF @IsCreditSale = 1
        BEGIN
            EXEC sp_AddCreditUsage 
                @CustomerId = @CustomerId,
                @Amount = @TotalAmount,
                @ReferenceNumber = @InvoiceNumber,
                @Description = 'Commercial cylinder purchase on credit';
        END

        -- Add transaction to credit history
        IF @IsCreditSale = 1
        BEGIN
            INSERT INTO dbo.CreditTransactions (
                CustomerId,
                TransactionType,
                Amount,
                ReferenceNumber,
                Description,
                TransactionDate,
                CreatedAt
            )
            VALUES (
                @CustomerId,
                'Debit',
                @TotalAmount,
                @InvoiceNumber,
                CONCAT('Commercial cylinder delivery - ', @Quantity, ' cylinders'),
                GETDATE(),
                GETDATE()
            );
        END

        SELECT 1 AS success, 'Customer mapping created successfully' AS message;

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
-- 6. SP: Delete Customer Mapping
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_DeleteCustomerMapping]
    @MappingId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Get mapping details
        DECLARE @CustomerId INT;
        DECLARE @TotalAmount DECIMAL(18, 2);
        DECLARE @IsCreditSale BIT;

        SELECT 
            @CustomerId = CustomerId,
            @TotalAmount = TotalAmount,
            @IsCreditSale = IsCreditSale
        FROM dbo.DailyDeliveryCustomerMapping
        WHERE MappingId = @MappingId;

        IF @CustomerId IS NULL
        BEGIN
            RAISERROR('Mapping not found', 16, 1);
            RETURN;
        END

        -- If it was a credit sale, reverse the credit usage
        IF @IsCreditSale = 1
        BEGIN
            UPDATE dbo.CustomerCredit
            SET 
                CreditUsed = CreditUsed - @TotalAmount,
                CreditAvailable = CreditAvailable + @TotalAmount,
                OutstandingAmount = OutstandingAmount - @TotalAmount,
                UpdatedAt = GETDATE()
            WHERE CustomerId = @CustomerId;
        END

        -- Delete the mapping
        DELETE FROM dbo.DailyDeliveryCustomerMapping
        WHERE MappingId = @MappingId;

        SELECT 1 AS success, 'Mapping deleted successfully' AS message;

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

PRINT 'Daily Delivery Customer Mapping stored procedures created successfully!'
