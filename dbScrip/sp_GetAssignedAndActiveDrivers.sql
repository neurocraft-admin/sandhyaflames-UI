CREATE PROCEDURE sp_GetAssignedAndActiveDrivers --2
    @VehicleId INT
AS
BEGIN
    -- Get assigned driver (latest assignment or just by vehicle)
    SELECT TOP 1 va.DriverId, d.FullName
    FROM VehicleAssignments va
    JOIN Drivers d ON va.DriverId = d.DriverId
    WHERE va.VehicleId = @VehicleId
    ORDER BY va.VehicleId DESC  -- or remove if not using dates

    -- Get all active drivers
    SELECT d.DriverId, d.FullName
    FROM Drivers d
    WHERE d.IsActive = 1
END
GO
