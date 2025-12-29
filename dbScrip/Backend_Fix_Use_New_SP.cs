// ============================================================================
// UPDATE BACKEND: Use sp_GetUserPermissions Instead
// File: Your permissions route file (e.g., PermissionRoutes.cs)
// ============================================================================

// FIND THIS CODE in your backend:
// ────────────────────────────────────────────────────────────────────────────

public static void MapPermissionRoutes(this IEndpointRouteBuilder app)
{
    var group = app.MapGroup("/api/permissions").WithTags("Permissions");

    group.MapGet("/user/{userId:int}", async (int userId, IConfiguration config) =>
    {
        var parameters = new[]
        {
            new SqlParameter("@UserId", userId)
        };

        // ❌ OLD: Calls Permissions_GetForUser (broken/old)
        var table = DailyDeliverySqlHelper.ExecuteDataTable(config, "dbo.Permissions_GetForUser", parameters);

        var list = new List<PermissionModel>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(new PermissionModel
            {
                ResourceKey = row["ResourceKey"].ToString()!,
                PermissionMask = Convert.ToInt32(row["PermissionMask"])
            });
        }

        return Results.Ok(list);
    });
}


// REPLACE WITH THIS:
// ────────────────────────────────────────────────────────────────────────────

public static void MapPermissionRoutes(this IEndpointRouteBuilder app)
{
    var group = app.MapGroup("/api/permissions").WithTags("Permissions");

    group.MapGet("/user/{userId:int}", async (int userId, IConfiguration config) =>
    {
        var parameters = new[]
        {
            new SqlParameter("@UserId", userId)
        };

        // ✅ NEW: Calls sp_GetUserPermissions (the one we tested and works!)
        var table = DailyDeliverySqlHelper.ExecuteDataTable(config, "dbo.sp_GetUserPermissions", parameters);

        var list = new List<PermissionModel>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(new PermissionModel
            {
                ResourceKey = row["ResourceKey"].ToString()!,
                PermissionMask = Convert.ToInt32(row["PermissionMask"])
            });
        }

        return Results.Ok(list);
    });
}


// ============================================================================
// WHAT TO CHANGE: Just ONE line!
// ============================================================================
//
// Change:
//   var table = DailyDeliverySqlHelper.ExecuteDataTable(config, "dbo.Permissions_GetForUser", parameters);
//
// To:
//   var table = DailyDeliverySqlHelper.ExecuteDataTable(config, "dbo.sp_GetUserPermissions", parameters);
//
// ============================================================================


// ============================================================================
// WHY THIS IS BETTER:
// ============================================================================
// ✅ sp_GetUserPermissions is already created and tested (returns 16 rows)
// ✅ Uses RolePermissions table with PermissionMask (new architecture)
// ✅ No need to keep old broken stored procedure
// ✅ Consistent naming with other SPs (sp_ prefix)
// ✅ One small change vs recreating stored procedure
// ============================================================================
