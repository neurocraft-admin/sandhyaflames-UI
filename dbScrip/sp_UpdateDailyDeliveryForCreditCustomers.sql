-- Add HasCreditCustomers column to DailyDelivery table
USE [sandhyaflames]
GO

-- Check if column already exists before adding
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID(N'[dbo].[DailyDelivery]') 
               AND name = 'HasCreditCustomers')
BEGIN
    ALTER TABLE [dbo].[DailyDelivery]
    ADD HasCreditCustomers BIT NOT NULL DEFAULT 0;
    
    PRINT 'Column HasCreditCustomers added successfully to DailyDelivery table.';
END
ELSE
BEGIN
    PRINT 'Column HasCreditCustomers already exists in DailyDelivery table.';
END
GO

-- Update the sp_CreateDailyDelivery stored procedure to include HasCreditCustomers
IF OBJECT_ID('sp_CreateDailyDelivery', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateDailyDelivery;
GO

CREATE PROCEDURE sp_CreateDailyDelivery
    @DeliveryDate DATE,
    @DriverId INT,
    @VehicleId INT,
    @StartTime TIME,
    @ReturnTime TIME = NULL,
    @Remarks NVARCHAR(500) = NULL,
    @HasCreditCustomers BIT = 0,
    @Items NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Validate Driver exists and is active
        IF NOT EXISTS (SELECT 1 FROM Drivers WHERE DriverId = @DriverId AND IsActive = 1)
        BEGIN
            RAISERROR('Invalid or inactive driver.', 16, 1);
            RETURN;
        END

        -- Validate Vehicle exists and is active
        IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE VehicleId = @VehicleId AND IsActive = 1)
        BEGIN
            RAISERROR('Invalid or inactive vehicle.', 16, 1);
            RETURN;
        END

        BEGIN TRANSACTION;

        -- Insert DailyDelivery
        DECLARE @DeliveryId INT;
        INSERT INTO DailyDelivery (DeliveryDate, DriverId, VehicleId, StartTime, ReturnTime, Remarks, HasCreditCustomers, IsActive)
        VALUES (@DeliveryDate, @DriverId, @VehicleId, @StartTime, @ReturnTime, @Remarks, @HasCreditCustomers, 1);

        SET @DeliveryId = SCOPE_IDENTITY();

        -- Insert Items
        INSERT INTO DailyDeliveryItems (DeliveryId, ProductId, Quantity, UnitPrice, Discount, NetAmount)
        SELECT 
            @DeliveryId,
            ProductId,
            Quantity,
            UnitPrice,
            Discount,
            NetAmount
        FROM OPENJSON(@Items)
        WITH (
            ProductId INT,
            Quantity INT,
            UnitPrice DECIMAL(18,2),
            Discount DECIMAL(18,2),
            NetAmount DECIMAL(18,2)
        );

        COMMIT TRANSACTION;

        SELECT @DeliveryId AS DeliveryId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

-- Update sp_GetDeliverySummary to include HasCreditCustomers
IF OBJECT_ID('sp_GetDeliverySummary', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetDeliverySummary;
GO

CREATE PROCEDURE sp_GetDeliverySummary
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        dd.DeliveryId,
        dd.DeliveryDate,
        d.DriverName,
        dd.VehicleId,
        v.VehicleNumber AS VehicleNo,
        v.VehicleNumber,
        dd.StartTime,
        dd.ReturnTime,
        dd.Remarks,
        dd.HasCreditCustomers,
        CASE 
            WHEN dd.ReturnTime IS NOT NULL THEN 'Completed'
            ELSE 'Pending'
        END AS Status,
        ISNULL(SUM(CASE WHEN i.InvoiceNumber IS NOT NULL THEN 1 ELSE 0 END), 0) AS CompletedInvoices,
        ISNULL(SUM(CASE WHEN i.InvoiceNumber IS NULL THEN 1 ELSE 0 END), 0) AS PendingInvoices,
        ISNULL(SUM(i.CashCollected), 0) AS CashCollected,
        ISNULL(SUM(i.EmptyCylindersReturned), 0) AS EmptyCylindersReturned,
        ISNULL(SUM(CASE WHEN p.CategoryId IN (SELECT CategoryId FROM Categories WHERE CategoryName LIKE '%Cylinder%') THEN ddi.Quantity ELSE 0 END), 0) AS CylindersDelivered,
        ISNULL(SUM(CASE WHEN p.CategoryId NOT IN (SELECT CategoryId FROM Categories WHERE CategoryName LIKE '%Cylinder%') THEN ddi.Quantity ELSE 0 END), 0) AS NonCylItemsDelivered,
        ISNULL(SUM(i.TotalAmount), 0) AS TotalCollection,
        ISNULL(SUM(ddi.Quantity), 0) AS TotalItemsDelivered,
        CASE 
            WHEN COUNT(i.InvoiceId) > 0 
            THEN CAST(SUM(CASE WHEN i.InvoiceNumber IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(i.InvoiceId) AS DECIMAL(5,2))
            ELSE 0 
        END AS DeliveryCompletionRate
    FROM DailyDelivery dd
    INNER JOIN Drivers d ON dd.DriverId = d.DriverId
    INNER JOIN Vehicles v ON dd.VehicleId = v.VehicleId
    LEFT JOIN DailyDeliveryItems ddi ON dd.DeliveryId = ddi.DeliveryId
    LEFT JOIN Products p ON ddi.ProductId = p.ProductId
    LEFT JOIN Invoices i ON dd.DeliveryId = i.DeliveryId
    WHERE dd.IsActive = 1
    GROUP BY 
        dd.DeliveryId, 
        dd.DeliveryDate, 
        d.DriverName,
        dd.VehicleId,
        v.VehicleNumber,
        dd.StartTime,
        dd.ReturnTime,
        dd.Remarks,
        dd.HasCreditCustomers
    ORDER BY dd.DeliveryDate DESC, dd.DeliveryId DESC;
END
GO

PRINT 'Database schema and stored procedures updated successfully for HasCreditCustomers feature.';
