-- ============================================================================
-- UPDATE EXISTING Permissions_GetForUser
-- Fix to return permissions from RolePermissions table
-- ============================================================================

USE [sandhyaflames];
GO

-- Update the existing stored procedure
CREATE OR ALTER PROCEDURE Permissions_GetForUser
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
