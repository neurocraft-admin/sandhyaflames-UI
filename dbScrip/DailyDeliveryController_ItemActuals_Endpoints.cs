// =============================================
// ADD THESE ENDPOINTS TO YOUR EXISTING DailyDeliveryController.cs
// Location: Controllers/DailyDeliveryController.cs
// =============================================

// 1. ADD THESE MODEL CLASSES (at the end of the controller file or in a separate Models folder)

public class ItemActualDto
{
    public int ActualId { get; set; }
    public int DeliveryId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public string CategoryName { get; set; }
    public int PlannedQuantity { get; set; }
    public int DeliveredQuantity { get; set; }
    public int PendingQuantity { get; set; }
    public decimal CashCollected { get; set; }
    public string ItemStatus { get; set; }
    public string? Remarks { get; set; }
    public DateTime UpdatedAt { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
}

public class UpdateItemActualsRequest
{
    public List<ItemActualInput> Items { get; set; }
}

public class ItemActualInput
{
    public int ProductId { get; set; }
    public int Delivered { get; set; }
    public int Pending { get; set; }
    public decimal CashCollected { get; set; }
    public string? Remarks { get; set; }
}

public class CloseDeliveryWithItemsRequest
{
    public string ReturnTime { get; set; }
    public int EmptyCylindersReturned { get; set; }
    public string? Remarks { get; set; }
}

// 2. ADD THESE 5 ENDPOINTS TO YOUR DailyDeliveryController CLASS

// =============================================
// ENDPOINT 1: Initialize Item Actuals
// =============================================
[HttpPost("{deliveryId}/items/initialize")]
public async Task<IActionResult> InitializeItemActuals(int deliveryId)
{
    try
    {
        using var conn = new SqlConnection(_connectionString);
        using var cmd = new SqlCommand("sp_InitializeDeliveryItemActuals", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@DeliveryId", deliveryId);

        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();

        if (reader.Read())
        {
            return Ok(new
            {
                success = reader.GetInt32(0),
                message = reader.GetString(1)
            });
        }

        return StatusCode(500, new { message = "Failed to initialize item actuals" });
    }
    catch (SqlException ex)
    {
        return BadRequest(new { message = ex.Message });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "An error occurred", detail = ex.Message });
    }
}

// =============================================
// ENDPOINT 2: Get Item-Level Actuals
// =============================================
[HttpGet("{deliveryId}/items/actuals")]
public async Task<IActionResult> GetItemActuals(int deliveryId)
{
    try
    {
        using var conn = new SqlConnection(_connectionString);
        using var cmd = new SqlCommand("sp_GetDeliveryItemActuals", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@DeliveryId", deliveryId);

        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();

        var items = new List<ItemActualDto>();
        while (reader.Read())
        {
            items.Add(new ItemActualDto
            {
                ActualId = reader.GetInt32(reader.GetOrdinal("ActualId")),
                DeliveryId = reader.GetInt32(reader.GetOrdinal("DeliveryId")),
                ProductId = reader.GetInt32(reader.GetOrdinal("ProductId")),
                ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                PlannedQuantity = reader.GetInt32(reader.GetOrdinal("PlannedQuantity")),
                DeliveredQuantity = reader.GetInt32(reader.GetOrdinal("DeliveredQuantity")),
                PendingQuantity = reader.GetInt32(reader.GetOrdinal("PendingQuantity")),
                CashCollected = reader.GetDecimal(reader.GetOrdinal("CashCollected")),
                ItemStatus = reader.GetString(reader.GetOrdinal("ItemStatus")),
                Remarks = reader.IsDBNull(reader.GetOrdinal("Remarks")) ? null : reader.GetString(reader.GetOrdinal("Remarks")),
                UpdatedAt = reader.GetDateTime(reader.GetOrdinal("UpdatedAt")),
                UnitPrice = reader.GetDecimal(reader.GetOrdinal("UnitPrice")),
                TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount"))
            });
        }

        return Ok(items);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "An error occurred", detail = ex.Message });
    }
}

// =============================================
// ENDPOINT 3: Update Item-Level Actuals (Bulk)
// =============================================
[HttpPut("{deliveryId}/items/actuals")]
public async Task<IActionResult> UpdateItemActuals(int deliveryId, [FromBody] UpdateItemActualsRequest request)
{
    try
    {
        var itemsJson = System.Text.Json.JsonSerializer.Serialize(request.Items, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
        });

        using var conn = new SqlConnection(_connectionString);
        using var cmd = new SqlCommand("sp_UpdateDeliveryItemActuals", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@DeliveryId", deliveryId);
        cmd.Parameters.AddWithValue("@ItemsJson", itemsJson);

        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();

        if (reader.Read())
        {
            return Ok(new
            {
                success = reader.GetInt32(0),
                message = reader.GetString(1)
            });
        }

        return StatusCode(500, new { message = "Failed to update item actuals" });
    }
    catch (SqlException ex)
    {
        return BadRequest(new { message = ex.Message });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "An error occurred", detail = ex.Message });
    }
}

// =============================================
// ENDPOINT 4: Get Delivery With Item Actuals (Multiple Result Sets)
// =============================================
[HttpGet("{deliveryId}/with-items")]
public async Task<IActionResult> GetDeliveryWithItems(int deliveryId)
{
    try
    {
        using var conn = new SqlConnection(_connectionString);
        using var cmd = new SqlCommand("sp_GetDeliveryWithItemActuals", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@DeliveryId", deliveryId);

        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();

        // First result set: Delivery header
        object? delivery = null;
        if (reader.Read())
        {
            delivery = new
            {
                deliveryId = reader.GetInt32(reader.GetOrdinal("DeliveryId")),
                deliveryDate = reader.GetDateTime(reader.GetOrdinal("DeliveryDate")),
                vehicleId = reader.GetInt32(reader.GetOrdinal("VehicleId")),
                vehicleNumber = reader.GetString(reader.GetOrdinal("VehicleNumber")),
                status = reader.GetString(reader.GetOrdinal("Status")),
                returnTime = reader.IsDBNull(reader.GetOrdinal("ReturnTime")) ? null : reader.GetTimeSpan(reader.GetOrdinal("ReturnTime")).ToString(),
                remarks = reader.IsDBNull(reader.GetOrdinal("Remarks")) ? null : reader.GetString(reader.GetOrdinal("Remarks")),
                completedInvoices = reader.GetInt32(reader.GetOrdinal("CompletedInvoices")),
                pendingInvoices = reader.GetInt32(reader.GetOrdinal("PendingInvoices")),
                cashCollected = reader.GetDecimal(reader.GetOrdinal("CashCollected")),
                emptyCylindersReturned = reader.GetInt32(reader.GetOrdinal("EmptyCylindersReturned"))
            };
        }

        // Move to second result set: Items
        await reader.NextResultAsync();
        var items = new List<ItemActualDto>();
        while (reader.Read())
        {
            items.Add(new ItemActualDto
            {
                ActualId = reader.GetInt32(reader.GetOrdinal("ActualId")),
                DeliveryId = reader.GetInt32(reader.GetOrdinal("DeliveryId")),
                ProductId = reader.GetInt32(reader.GetOrdinal("ProductId")),
                ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                PlannedQuantity = reader.GetInt32(reader.GetOrdinal("PlannedQuantity")),
                DeliveredQuantity = reader.GetInt32(reader.GetOrdinal("DeliveredQuantity")),
                PendingQuantity = reader.GetInt32(reader.GetOrdinal("PendingQuantity")),
                CashCollected = reader.GetDecimal(reader.GetOrdinal("CashCollected")),
                ItemStatus = reader.GetString(reader.GetOrdinal("ItemStatus")),
                Remarks = reader.IsDBNull(reader.GetOrdinal("Remarks")) ? null : reader.GetString(reader.GetOrdinal("Remarks")),
                UpdatedAt = reader.GetDateTime(reader.GetOrdinal("UpdatedAt")),
                UnitPrice = reader.GetDecimal(reader.GetOrdinal("UnitPrice")),
                TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount"))
            });
        }

        if (delivery == null)
        {
            return NotFound(new { message = "Delivery not found" });
        }

        return Ok(new { delivery, items });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "An error occurred", detail = ex.Message });
    }
}

// =============================================
// ENDPOINT 5: Close Delivery With Item Verification
// =============================================
[HttpPut("{deliveryId}/close-with-items")]
public async Task<IActionResult> CloseDeliveryWithItems(int deliveryId, [FromBody] CloseDeliveryWithItemsRequest request)
{
    try
    {
        using var conn = new SqlConnection(_connectionString);
        using var cmd = new SqlCommand("sp_CloseDeliveryWithItemActuals", conn); // Note: Correct SP name
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@DeliveryId", deliveryId);
        cmd.Parameters.AddWithValue("@ReturnTime", TimeSpan.Parse(request.ReturnTime));
        cmd.Parameters.AddWithValue("@EmptyCylindersReturned", request.EmptyCylindersReturned);
        cmd.Parameters.AddWithValue("@Remarks", (object?)request.Remarks ?? DBNull.Value);

        await conn.OpenAsync();
        using var reader = await cmd.ExecuteReaderAsync();

        if (reader.Read())
        {
            return Ok(new
            {
                success = reader.GetInt32(0),
                message = reader.GetString(1)
            });
        }

        return StatusCode(500, new { message = "Failed to close delivery" });
    }
    catch (SqlException ex)
    {
        return BadRequest(new { message = ex.Message });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "An error occurred", detail = ex.Message });
    }
}

// =============================================
// REQUIRED USING STATEMENTS (add to top of file if missing)
// =============================================
/*
using Microsoft.Data.SqlClient;  // or System.Data.SqlClient
using System.Data;
using System.Text.Json;
*/

// =============================================
// TESTING CHECKLIST
// =============================================
/*
1. Build the project - verify no compilation errors
2. Run the API - check Swagger UI shows all 5 new endpoints
3. Test sequence:
   a. POST /api/dailydelivery/{id}/items/initialize
   b. GET /api/dailydelivery/{id}/items/actuals
   c. PUT /api/dailydelivery/{id}/items/actuals (with sample data)
   d. GET /api/dailydelivery/{id}/with-items
   e. PUT /api/dailydelivery/{id}/close-with-items
4. Verify responses match expected format
5. Check SQL Server that data is being saved correctly
*/
