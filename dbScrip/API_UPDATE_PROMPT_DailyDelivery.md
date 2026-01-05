# Backend API Update Request: Daily Delivery List Endpoint

## Overview
The frontend application requires additional driver and vehicle information in the Daily Delivery list response. Currently, the API returns only `VehicleId` without driver or vehicle names, making it difficult for users to identify deliveries.

## Current API Endpoint
- **Method:** GET
- **Route:** `/api/dailydelivery`
- **Stored Procedure:** `sp_ListDailyDeliveries`
- **Optional Query Parameters:**
  - `fromDate` (date)
  - `toDate` (date)
  - `vehicleId` (int)
  - `status` (string)

## Database Changes (Already Completed)
The database has been updated with the following changes (see `sp_UpdateDailyDelivery_AddDriverVehicleInfo.sql`):

1. ✅ Added `DriverId INT NULL` column to `DailyDelivery` table
2. ✅ Added Foreign Key constraint `FK_DailyDelivery_Driver`
3. ✅ Updated existing records with DriverId from VehicleAssignment table
4. ✅ Updated `sp_ListDailyDelivery` with LEFT JOINs to Driver and Vehicle tables

The stored procedure now returns:
- `DriverId` (INT)
- `DriverName` (NVARCHAR - from Driver table)
- `VehicleName` (NVARCHAR - from Vehicle.VehicleNumber)

## Required API Changes

### 1. Update C# Model/DTO
Add the following properties to your Daily Delivery list response model:

```csharp
public class DailyDeliveryListDto
{
    public int DeliveryId { get; set; }
    public DateTime DeliveryDate { get; set; }
    public int VehicleId { get; set; }
    public int? DriverId { get; set; }  // NEW - nullable since it's nullable in DB
    public string VehicleName { get; set; }  // NEW - from Vehicle.VehicleNumber
    public string DriverName { get; set; }  // NEW - from Driver.DriverName
    public string Status { get; set; }
    public DateTime? ReturnTime { get; set; }
    public string Remarks { get; set; }
    
    // Metrics
    public int TotalCylindersDelivered { get; set; }
    public int TotalReturnsCollected { get; set; }
    public int NetCylindersOut { get; set; }
    public int TotalCustomersVisited { get; set; }
    public decimal TotalAmountCollected { get; set; }
    public decimal TotalCreditGiven { get; set; }
    public int PendingCustomers { get; set; }
}
```

### 2. Update Controller Method
Ensure your controller method maps all fields from the stored procedure result to the response DTO, including the new `DriverId`, `DriverName`, and `VehicleName` fields.

**Example Controller (if needed):**
```csharp
[HttpGet]
public async Task<IActionResult> GetDailyDeliveries(
    [FromQuery] DateTime? fromDate,
    [FromQuery] DateTime? toDate,
    [FromQuery] int? vehicleId,
    [FromQuery] string status)
{
    var deliveries = await _repository.GetDailyDeliveries(fromDate, toDate, vehicleId, status);
    return Ok(deliveries);
}
```

### 3. Repository/Data Access Layer
Ensure your data access code properly maps the new columns from `sp_ListDailyDeliveries`:
- `DriverId` → DTO.DriverId
- `DriverName` → DTO.DriverName
- `VehicleName` → DTO.VehicleName

## Expected API Response Format

### Before (Current - Missing Driver/Vehicle Info):
```json
{
  "DeliveryId": 52,
  "DeliveryDate": "2026-01-04T00:00:00",
  "VehicleId": 6,
  "Status": "Open",
  "ReturnTime": null,
  "Remarks": null,
  "TotalCylindersDelivered": 5,
  "TotalReturnsCollected": 0,
  "NetCylindersOut": 5,
  "TotalCustomersVisited": 5,
  "TotalAmountCollected": 4950.00,
  "TotalCreditGiven": 0.00,
  "PendingCustomers": 0
}
```

### After (Expected - With Driver/Vehicle Info):
```json
{
  "DeliveryId": 52,
  "DeliveryDate": "2026-01-04T00:00:00",
  "VehicleId": 6,
  "DriverId": 3,
  "VehicleName": "TN-01-AB-1234",
  "DriverName": "Rajesh Kumar",
  "Status": "Open",
  "ReturnTime": null,
  "Remarks": null,
  "TotalCylindersDelivered": 5,
  "TotalReturnsCollected": 0,
  "NetCylindersOut": 5,
  "TotalCustomersVisited": 5,
  "TotalAmountCollected": 4950.00,
  "TotalCreditGiven": 0.00,
  "PendingCustomers": 0
}
```

## Testing Instructions

### 1. Verify Database Changes
Run the verification query from the SQL script:
```sql
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
```

Expected: You should see DriverId, VehicleName, and DriverName populated for recent deliveries.

### 2. Test API Endpoint
**Request:**
```
GET /api/dailydelivery
```

**Expected Response:** JSON array with objects containing:
- ✅ `DriverId` (nullable int)
- ✅ `DriverName` (string, null if driver not assigned)
- ✅ `VehicleName` (string, null if vehicle deleted)
- ✅ All existing fields (DeliveryId, DeliveryDate, VehicleId, Status, metrics, etc.)

### 3. Test with Filters
```
GET /api/dailydelivery?fromDate=2026-01-01&toDate=2026-01-31&vehicleId=6&status=Open
```

Expected: Filtered results should still include DriverId, DriverName, and VehicleName fields.

### 4. Edge Cases to Test
- **No Driver Assigned:** `DriverId` should be null, `DriverName` should be null
- **Deleted Vehicle:** `VehicleName` should be null (LEFT JOIN handles this)
- **Deleted Driver:** `DriverName` should be null (LEFT JOIN handles this)

## Frontend Dependencies
The Angular frontend is already updated and ready to display:
- Vehicle Name in the "Vehicle" column
- Driver Name in the "Driver" column

The UI will show "-" for null values automatically using: `{{ d.VehicleName || '-' }}` and `{{ d.DriverName || '-' }}`

## Priority
**HIGH** - This blocks user functionality. The deliveries list is currently showing only dashes ("-") for driver and vehicle columns, making it impossible to identify which driver/vehicle a delivery belongs to.

## Files Changed
- ✅ Frontend: `daily-delivery.component.html` (updated with Vehicle column)
- ✅ Frontend: `daily-delivery.component.ts` (ready to consume DriverName/VehicleName)
- ✅ Database: `sp_UpdateDailyDelivery_AddDriverVehicleInfo.sql` (run this first)
- ⏳ **Backend API: Needs update** (this request)

## Contact
If you have questions about the frontend expectations or need to see the Angular code consuming this API, please reach out to the frontend team.
