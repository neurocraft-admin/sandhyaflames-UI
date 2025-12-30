-- ============================================================================
-- Fix RoleTester Role - Grant DailyDelivery Permissions and MenuAccess
-- ============================================================================

USE [sandhyaflames];
GO

DECLARE @RoleId INT = 6; -- RoleTester
DECLARE @DailyDeliveryResourceId INT = 4;

-- ============================================================================
-- 1. Grant DailyDelivery View Permission
-- ============================================================================
PRINT '1. Granting DailyDelivery View permission to RoleTester...';

-- Permission Bitmask Values:
-- View = 1, Create = 2, Update = 4, Delete = 8, Export = 16, Approve = 32
DECLARE @ViewPermission INT = 1;

-- Check if permission already exists
IF NOT EXISTS (
    SELECT 1 FROM RolePermissions 
    WHERE RoleId = @RoleId AND ResourceId = @DailyDeliveryResourceId
)
BEGIN
    INSERT INTO RolePermissions (RoleId, ResourceId, PermissionMask)
    VALUES (@RoleId, @DailyDeliveryResourceId, @ViewPermission);
    PRINT '   ✅ DailyDelivery View permission granted';
END
ELSE
BEGIN
    -- Update existing permission to ensure View is enabled (bitwise OR)
    UPDATE RolePermissions
    SET PermissionMask = PermissionMask | @ViewPermission
    WHERE RoleId = @RoleId AND ResourceId = @DailyDeliveryResourceId;
    PRINT '   ✅ DailyDelivery View permission updated';
END

-- ============================================================================
-- 2. Grant MenuAccess for Dashboard and DailyDelivery
-- ============================================================================
PRINT '2. Granting MenuAccess to RoleTester...';

-- Grant access to all menu items that RoleTester should see
INSERT INTO MenuAccess (MenuId, RoleId)
SELECT mi.MenuId, @RoleId
FROM MenuItems mi
WHERE mi.IsActive = 1
  AND mi.Name IN ('Dashboard', 'Daily Delivery', 'Delivery')  -- Include parent menu if hierarchical
  AND NOT EXISTS (
      SELECT 1 FROM MenuAccess ma 
      WHERE ma.MenuId = mi.MenuId AND ma.RoleId = @RoleId
  );

DECLARE @MenuAccessCount INT = @@ROWCOUNT;
PRINT '   ✅ Granted access to ' + CAST(@MenuAccessCount AS NVARCHAR(10)) + ' menu items';

-- ============================================================================
-- 3. Verify the changes
-- ============================================================================
PRINT '3. Verification:';
PRINT '';

-- Check RolePermissions
PRINT 'RolePermissions for RoleTester:';
SELECT 
    r.RoleName,
    res.ResourceName,
    rp.PermissionMask,
    CASE WHEN (rp.PermissionMask & 1) = 1 THEN 'Yes' ELSE 'No' END AS CanView,
    CASE WHEN (rp.PermissionMask & 2) = 2 THEN 'Yes' ELSE 'No' END AS CanCreate,
    CASE WHEN (rp.PermissionMask & 4) = 4 THEN 'Yes' ELSE 'No' END AS CanUpdate,
    CASE WHEN (rp.PermissionMask & 8) = 8 THEN 'Yes' ELSE 'No' END AS CanDelete
FROM RolePermissions rp
JOIN Roles r ON rp.RoleId = r.RoleId
JOIN Resources res ON rp.ResourceId = res.ResourceId
WHERE r.RoleName = 'RoleTester';

PRINT '';

-- Check MenuAccess
PRINT 'MenuAccess for RoleTester:';
SELECT 
    r.RoleName,
    mi.Name AS MenuName,
    mi.Url AS MenuUrl
FROM MenuAccess ma
JOIN Roles r ON ma.RoleId = r.RoleId
JOIN MenuItems mi ON ma.MenuId = mi.MenuId
WHERE r.RoleName = 'RoleTester'
ORDER BY mi.Name;

PRINT '';
PRINT '============================================================================';
PRINT '✅ Fix completed! User roletester@sandhyaflames.in should now see:';
PRINT '   - Dashboard';
PRINT '   - Daily Delivery menu item';
PRINT '   - Can VIEW Daily Delivery (no create/update/delete)';
PRINT '';
PRINT '🔄 Ask the user to LOGOUT and LOGIN again to see the changes.';
PRINT '============================================================================';
