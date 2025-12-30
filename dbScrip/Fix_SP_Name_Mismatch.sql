-- ============================================================================
-- FIX: Rename sp_GetUserPermissions to Permissions_GetForUser
-- Backend expects: dbo.Permissions_GetForUser
-- We created: sp_GetUserPermissions
-- ============================================================================

USE [sandhyaflames];
GO

-- Drop the old name if it exists
IF OBJECT_ID('Permissions_GetForUser', 'P') IS NOT NULL
    DROP PROCEDURE Permissions_GetForUser;
GO

IF OBJECT_ID('sp_GetUserPermissions', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetUserPermissions;
GO

-- Create with the name the backend expects
CREATE PROCEDURE Permissions_GetForUser
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
-- TEST
-- ============================================================================

PRINT '============================================================================';
PRINT 'Testing Permissions_GetForUser for roletester user (UserId=18)';
PRINT '============================================================================';
PRINT '';

EXEC Permissions_GetForUser @UserId = 18;

PRINT '';
PRINT 'Expected: 16 rows with DailyDelivery PermissionMask = 15';
PRINT '============================================================================';
