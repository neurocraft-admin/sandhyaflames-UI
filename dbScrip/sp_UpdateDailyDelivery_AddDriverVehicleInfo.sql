-- =============================================
-- Script: Update DailyDelivery Table and sp_ListDailyDeliveries
-- Purpose: Add DriverId to DailyDelivery table and update stored procedure
--          to return Driver Name and Vehicle Name in the delivery list
-- Date: January 4, 2026
-- =============================================

-- Step 1: Add DriverId column to DailyDelivery table
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.columns 
               WHERE object_id = OBJECT_ID('DailyDelivery') 
               AND name = 'DriverId')
BEGIN
    ALTER TABLE DailyDelivery
    ADD DriverId INT NULL;
    
    PRINT 'DriverId column added to DailyDelivery table';
END
ELSE
BEGIN
    PRINT 'DriverId column already exists in DailyDelivery table';
END
GO

-- Step 2: Add Foreign Key constraint to Driver table
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys 
               WHERE name = 'FK_DailyDelivery_Driver')
BEGIN
    ALTER TABLE DailyDelivery
    ADD CONSTRAINT FK_DailyDelivery_Driver
    FOREIGN KEY (DriverId) REFERENCES Driver(DriverId);
    
    PRINT 'Foreign key constraint FK_DailyDelivery_Driver added';
END
ELSE
BEGIN
    PRINT 'Foreign key constraint FK_DailyDelivery_Driver already exists';
END
GO

-- Step 3: Update existing DailyDelivery records with DriverId
-- =============================================
-- Populate DriverId from VehicleAssignment table based on VehicleId and DeliveryDate
UPDATE dd
SET dd.DriverId = va.DriverId
FROM DailyDelivery dd
INNER JOIN VehicleAssignment va 
    ON dd.VehicleId = va.VehicleId 
    AND dd.DeliveryDate >= va.AssignmentStartDate
    AND (va.AssignmentEndDate IS NULL OR dd.DeliveryDate <= va.AssignmentEndDate)
WHERE dd.DriverId IS NULL;

PRINT 'Updated existing DailyDelivery records with DriverId from VehicleAssignment';
GO

-- Step 4: Update sp_ListDailyDeliveries stored procedure
-- =============================================
-- Add LEFT JOINs to Driver and Vehicle tables to retrieve names
ALTER PROCEDURE [dbo].[sp_ListDailyDeliveries]
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @VehicleId INT = NULL,
    @Status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        dd.DeliveryId,
        dd.DeliveryDate,
        dd.VehicleId,
        dd.DriverId,
        v.VehicleNumber AS VehicleName,
        d.DriverName,
        dd.Status,
        dd.ReturnTime,
        dd.Remarks,
        
        -- Metrics
        ISNULL(m.TotalCylindersDelivered, 0) AS TotalCylindersDelivered,
        ISNULL(m.TotalReturnsCollected, 0) AS TotalReturnsCollected,
        ISNULL(m.NetCylindersOut, 0) AS NetCylindersOut,
        ISNULL(m.TotalCustomersVisited, 0) AS TotalCustomersVisited,
        ISNULL(m.TotalAmountCollected, 0) AS TotalAmountCollected,
        ISNULL(m.TotalCreditGiven, 0) AS TotalCreditGiven,
        ISNULL(m.PendingCustomers, 0) AS PendingCustomers
        
    FROM DailyDelivery dd
    LEFT JOIN DailyDeliveryMetrics m ON dd.DeliveryId = m.DeliveryId
    LEFT JOIN Driver d ON dd.DriverId = d.DriverId
    LEFT JOIN Vehicle v ON dd.VehicleId = v.VehicleId
    
    WHERE (@FromDate IS NULL OR dd.DeliveryDate >= @FromDate)
      AND (@ToDate IS NULL OR dd.DeliveryDate <= @ToDate)
      AND (@VehicleId IS NULL OR dd.VehicleId = @VehicleId)
      AND (@Status IS NULL OR dd.Status = @Status)
    
    ORDER BY dd.DeliveryDate DESC, dd.DeliveryId DESC;
END
GO

PRINT 'Stored procedure sp_ListDailyDeliveries updated successfully';
GO

-- =============================================
-- Verification Query
-- =============================================
-- Run this to verify the changes
SELECT TOP 5
    dd.DeliveryId,
    dd.DeliveryDate,
    dd.VehicleId,
    dd.DriverId,
    v.VehicleNumber AS VehicleName,
    d.DriverName,
    dd.Status
FROM DailyDelivery dd
LEFT JOIN Driver d ON dd.DriverId = d.DriverId
LEFT JOIN Vehicle v ON dd.VehicleId = v.VehicleId
ORDER BY dd.DeliveryDate DESC;

PRINT 'Verification complete - Check the results above';
