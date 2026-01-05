-- =============================================
-- Update vw_DailyDeliverySummary to include Driver information
-- =============================================

USE [sandhyaflames]
GO

-- Drop and recreate the view with Driver information
IF OBJECT_ID('dbo.vw_DailyDeliverySummary', 'V') IS NOT NULL
    DROP VIEW dbo.vw_DailyDeliverySummary;
GO

CREATE VIEW dbo.vw_DailyDeliverySummary
AS
SELECT 
    dd.DeliveryId,
    dd.DeliveryDate,
    dd.VehicleId,
    dd.DriverId,
    v.VehicleNumber,
    d.FullName AS DriverName,
    dd.Status,
    dd.ReturnTime,
    dd.Remarks,
    
    -- Metrics
    ISNULL(m.CompletedInvoices, 0) AS CompletedInvoices,
    ISNULL(m.PendingInvoices, 0) AS PendingInvoices,
    ISNULL(m.CashCollected, 0.00) AS CashCollected,
    ISNULL(m.EmptyCylindersReturned, 0) AS EmptyCylindersReturned,
    ISNULL(m.OtherItemsDelivered, 0) AS OtherItemsDelivered,
    ISNULL(m.CylindersDelivered, 0) AS CylindersDelivered,
    ISNULL(m.NonCylItemsDelivered, 0) AS NonCylItemsDelivered,
    ISNULL(m.InvoiceCount, 0) AS InvoiceCount,
    ISNULL(m.DeliveryCount, 0) AS DeliveryCount,
    ISNULL(m.PlannedInvoices, 0) AS PlannedInvoices,
    
    -- Derived fields
    ISNULL(m.CashCollected, 0.00) AS TotalCollection,
    (ISNULL(m.CylindersDelivered, 0) + ISNULL(m.NonCylItemsDelivered, 0)) AS TotalItemsDelivered,
    
    -- Delivery completion rate capped at 100%
    CASE 
        WHEN ISNULL(m.InvoiceCount, 0) = 0 THEN 0.00
        WHEN m.CompletedInvoices >= m.InvoiceCount THEN 100.00
        ELSE CAST(
            (CAST(m.CompletedInvoices AS FLOAT) / CAST(m.InvoiceCount AS FLOAT)) * 100.0
            AS DECIMAL(5, 2)
        )
    END AS DeliveryCompletionRate
    
FROM dbo.DailyDelivery dd
LEFT JOIN dbo.DailyDeliveryMetrics m ON m.DeliveryId = dd.DeliveryId
LEFT JOIN dbo.Vehicles v ON v.VehicleId = dd.VehicleId
LEFT JOIN dbo.Drivers d ON dd.DriverId = d.DriverId;
GO

PRINT 'View vw_DailyDeliverySummary updated successfully with Driver information!';
