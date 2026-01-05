# Backend API Request: Get Assigned Driver by Vehicle

## Overview
The frontend needs to fetch the assigned driver for a specific vehicle on a given date when the user selects a vehicle in the Daily Delivery form.

## Required API Endpoint

### Endpoint Details
- **Method:** GET
- **Route:** `/api/vehicles/{vehicleId}/assigned-driver`
- **Query Parameter:** `date` (required, format: YYYY-MM-DD)

### Purpose
When creating a daily delivery, after the user selects a vehicle and delivery date, the system should automatically determine which driver is assigned to that vehicle on that date (from VehicleAssignment table).

## Request Example
```
GET /api/vehicles/6/assigned-driver?date=2026-01-05
```

## Expected Response Format

### Success - Driver Found:
```json
{
  "driverId": 3,
  "driverName": "Rajesh Kumar"
}
```

### Success - No Driver Assigned:
```json
{
  "driverId": null,
  "driverName": null
}
```
**OR**
```json
null
```

### Error - Vehicle Not Found:
```json
{
  "success": false,
  "errorCode": "VEHICLE_NOT_FOUND",
  "message": "Vehicle with ID 6 does not exist"
}
```
HTTP Status: 404

## Backend Implementation Guide

### 1. SQL Query Logic
```sql
SELECT 
    va.DriverId,
    d.DriverName
FROM VehicleAssignment va
INNER JOIN Driver d ON va.DriverId = d.DriverId
WHERE va.VehicleId = @VehicleId
  AND @Date >= va.AssignmentStartDate
  AND (@Date <= va.AssignmentEndDate OR va.AssignmentEndDate IS NULL)
  AND d.IsActive = 1
```

### 2. Example C# Controller Implementation
```csharp
[HttpGet("vehicles/{vehicleId}/assigned-driver")]
public async Task<IActionResult> GetAssignedDriver(
    int vehicleId,
    [FromQuery] string date)
{
    if (string.IsNullOrEmpty(date) || !DateTime.TryParse(date, out var deliveryDate))
    {
        return BadRequest(new { 
            success = false, 
            errorCode = "INVALID_DATE",
            message = "Valid date parameter is required (format: YYYY-MM-DD)" 
        });
    }

    try
    {
        using var conn = new SqlConnection(_config.GetConnectionString("DefaultConnection"));
        using var cmd = new SqlCommand(@"
            SELECT 
                va.DriverId,
                d.DriverName
            FROM VehicleAssignment va
            INNER JOIN Driver d ON va.DriverId = d.DriverId
            WHERE va.VehicleId = @VehicleId
              AND @Date >= va.AssignmentStartDate
              AND (@Date <= va.AssignmentEndDate OR va.AssignmentEndDate IS NULL)
              AND d.IsActive = 1
        ", conn);

        cmd.Parameters.AddWithValue("@VehicleId", vehicleId);
        cmd.Parameters.AddWithValue("@Date", deliveryDate);

        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return Ok(new
            {
                driverId = reader.GetInt32(reader.GetOrdinal("DriverId")),
                driverName = reader.GetString(reader.GetOrdinal("DriverName"))
            });
        }

        // No driver assigned for this vehicle on this date
        return Ok(new { driverId = (int?)null, driverName = (string?)null });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            success = false,
            errorCode = "INTERNAL_ERROR",
            message = ex.Message
        });
    }
}
```

### 3. Alternative: Stored Procedure Approach
Create stored procedure `sp_GetDriverByVehicleAndDate`:

```sql
CREATE PROCEDURE sp_GetDriverByVehicleAndDate
    @VehicleId INT,
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        va.DriverId,
        d.DriverName
    FROM VehicleAssignment va
    INNER JOIN Driver d ON va.DriverId = d.DriverId
    WHERE va.VehicleId = @VehicleId
      AND @Date >= va.AssignmentStartDate
      AND (@Date <= va.AssignmentEndDate OR va.AssignmentEndDate IS NULL)
      AND d.IsActive = 1;
END
```

## Frontend Usage Flow

1. User selects a **Vehicle** from dropdown
2. Frontend reads the **Delivery Date** from the form
3. Frontend calls: `GET /api/vehicles/{vehicleId}/assigned-driver?date={deliveryDate}`
4. If driver found:
   - Display driver name in "Assigned Driver: Rajesh Kumar" label
   - Auto-select driver in the dropdown
   - Set `driverId` in form (will be sent when saving)
5. If no driver found:
   - Display "Assigned Driver: None"
   - User must manually select a driver

## Business Logic Notes

- The endpoint looks up the **active assignment** on the given date
- Uses VehicleAssignment table with date range logic:
  - Assignment is active if: `date >= AssignmentStartDate AND (date <= AssignmentEndDate OR AssignmentEndDate IS NULL)`
- Only returns **active drivers** (IsActive = 1)
- If multiple assignments overlap (shouldn't happen with proper constraints), returns the first match

## Testing Instructions

### Test Case 1: Vehicle with Assigned Driver
```
GET /api/vehicles/6/assigned-driver?date=2026-01-05
```
**Expected:** `{ "driverId": 3, "driverName": "Rajesh Kumar" }`

### Test Case 2: Vehicle without Assigned Driver
```
GET /api/vehicles/99/assigned-driver?date=2026-01-05
```
**Expected:** `{ "driverId": null, "driverName": null }` OR `null`

### Test Case 3: Invalid Date Format
```
GET /api/vehicles/6/assigned-driver?date=invalid
```
**Expected:** 400 Bad Request with error message

### Test Case 4: Date Outside Assignment Range
```
GET /api/vehicles/6/assigned-driver?date=2020-01-01
```
**Expected:** `{ "driverId": null, "driverName": null }` (assuming no assignment in 2020)

## Priority
**MEDIUM** - Required for automatic driver selection when user chooses a vehicle. Currently, users must manually select both vehicle and driver. This feature improves UX by auto-filling the driver based on current vehicle assignments.

## Related Endpoints
- ✅ POST `/api/dailydelivery` - Already accepts DriverId in request body
- ⏳ GET `/api/vehicles/{vehicleId}/assigned-driver` - **NEW** (this request)
- ✅ GET `/api/dailydelivery` - Updated to return DriverName and VehicleName (see API_UPDATE_PROMPT_DailyDelivery.md)

## Frontend Files Modified
- ✅ `daily-delivery.component.ts` - Added `onVehicleChange()` method
- ✅ `daily-delivery.component.html` - Added `(change)="onVehicleChange()"` to vehicle select
- ✅ `vehicle.service.ts` - Added `getDriverByVehicle(vehicleId, date)` method
