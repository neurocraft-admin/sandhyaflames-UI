// ============================================================================
// GET USER PERMISSIONS - Minimal API Pattern
// Add this to your RolePermissionRoutes.cs or PermissionsRoutes.cs
// ============================================================================

// 🔴 CRITICAL: This matches your existing minimal API pattern
group.MapGet("/user/{userId}", async (int userId, IConfiguration configuration) =>
{
    try
    {
        var permissions = new List<object>();
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        using var command = new SqlCommand("sp_GetUserPermissions", connection);
        command.CommandType = CommandType.StoredProcedure;
        command.Parameters.AddWithValue("@UserId", userId);

        // 🔴 CRITICAL: Must use ExecuteReaderAsync, NOT ExecuteNonQueryAsync
        using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            permissions.Add(new
            {
                resourceKey = reader["ResourceKey"].ToString(),
                permissionMask = Convert.ToInt32(reader["PermissionMask"])
            });
        }

        return Results.Ok(permissions);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error fetching user permissions: {ex.Message}");
    }
})
.WithTags("Permissions")
.WithName("GetUserPermissions");


// ============================================================================
// WHERE TO ADD THIS CODE
// ============================================================================
// 
// 🔴 CRITICAL: Add to the PERMISSIONS group, NOT the roles group!
//
// Look for a file like:
//   - RolePermissionRoutes.cs
//   - PermissionsRoutes.cs
//   - Program.cs (where you register routes)
//
// Find where you have:
//   var group = app.MapGroup("/api/permissions");  ← PERMISSIONS, not "roles"
//
// REPLACE or ADD this endpoint:
//   
//   var group = app.MapGroup("/api/permissions");  ← Must be permissions!
//   
//   // Either REPLACE the existing MapGet if it exists:
//   group.MapGet("/user/{userId}", async (int userId, IConfiguration configuration) => 
//   {
//       // ... the code above ...
//   });
//   
//   // Or ADD it if it doesn't exist
//   
//   group.MapPut("/{roleId}/permissions", async (int roleId, ...) => { ... });
//
// ============================================================================
//
// 🔴 If you already have this line:
//    group.MapGet("/user/{userId}", ...)
//
// REPLACE the entire implementation with the code above.
// The current implementation probably returns an empty list or isn't using
// the sp_GetUserPermissions stored procedure.
//
// ============================================================================


// ============================================================================
// TESTING
// ============================================================================
//
// 1. Run sp_GetUserPermissions.sql to create the stored procedure
// 2. Add this MapGet endpoint to your routes
// 3. Test in browser or Postman:
//    GET https://localhost:7183/api/permissions/user/18
//
// Expected Response:
// [
//   { "resourceKey": "Dashboard", "permissionMask": 1 },
//   { "resourceKey": "DailyDelivery", "permissionMask": 15 },
//   { "resourceKey": "CommercialDeliveries", "permissionMask": 15 },
//   ... (16 total)
// ]
//
// ============================================================================
