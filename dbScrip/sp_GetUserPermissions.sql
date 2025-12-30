-- ============================================================================
-- CREATE sp_GetUserPermissions
-- Returns permissions for a specific user based on their role
-- ============================================================================

USE [sandhyaflames];
GO

-- Drop if exists
IF OBJECT_ID('sp_GetUserPermissions', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetUserPermissions;
GO

CREATE PROCEDURE sp_GetUserPermissions
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Return all permissions for the user's role
    SELECT 
        rp.ResourceKey,
        rp.PermissionMask
    FROM Users u
    INNER JOIN RolePermissions rp ON u.RoleId = rp.RoleId
    WHERE u.UserId = @UserId
      AND u.IsActive = 1
    ORDER BY rp.ResourceKey;
END;
GO

-- ============================================================================
-- TEST THE STORED PROCEDURE
-- ============================================================================

PRINT '============================================================================';
PRINT 'Testing sp_GetUserPermissions for roletester user (UserId=18)';
PRINT '============================================================================';
PRINT '';

EXEC sp_GetUserPermissions @UserId = 18;

PRINT '';
PRINT '============================================================================';
PRINT 'Expected: 16 rows with ResourceKey and PermissionMask';
PRINT 'DailyDelivery should have PermissionMask = 15';
PRINT 'This is what the API endpoint GET /api/permissions/user/18 should return';
PRINT '============================================================================';
