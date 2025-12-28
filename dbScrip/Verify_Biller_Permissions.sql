-- ============================================================================
-- Verify Biller Role Permissions After Save
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Checking Biller Role Permissions';
PRINT '============================================================================';
PRINT '';

-- 1. Check what's saved in RolePermissions for Biller (RoleId=7)
PRINT '1. RolePermissions for Biller (RoleId=7):';
SELECT 
    rp.RolePermissionId,
    rp.RoleId,
    r.RoleName,
    rp.ResourceId,
    rp.ResourceKey,
    res.DisplayName,
    rp.PermissionMask,
    CASE WHEN (rp.PermissionMask & 1) = 1 THEN 'Yes' ELSE 'No' END AS CanView,
    CASE WHEN (rp.PermissionMask & 2) = 2 THEN 'Yes' ELSE 'No' END AS CanCreate,
    CASE WHEN (rp.PermissionMask & 4) = 4 THEN 'Yes' ELSE 'No' END AS CanUpdate,
    CASE WHEN (rp.PermissionMask & 8) = 8 THEN 'Yes' ELSE 'No' END AS CanDelete
FROM RolePermissions rp
JOIN Roles r ON rp.RoleId = r.RoleId
JOIN Resources res ON rp.ResourceId = res.ResourceId
WHERE rp.RoleId = 7
ORDER BY res.DisplayName;

PRINT '';

-- 2. Check MenuAccess for Biller
PRINT '2. MenuAccess for Biller (RoleId=7):';
SELECT 
    ma.MenuAccessId,
    ma.MenuId,
    mi.DisplayName,
    mi.Url,
    mi.ParentMenuId
FROM MenuAccess ma
JOIN MenuItems mi ON ma.MenuId = mi.MenuId
WHERE ma.RoleId = 7
ORDER BY mi.MenuId;

PRINT '';

-- 3. Simulate what API returns for roletester user
PRINT '3. What GET /api/permissions/user/18 should return:';
SELECT 
    rp.ResourceKey AS resourceKey,
    rp.PermissionMask AS permissionMask
FROM Users u
JOIN RolePermissions rp ON u.RoleId = rp.RoleId
WHERE u.UserId = 18
  AND u.IsActive = 1;

PRINT '';
PRINT '============================================================================';
PRINT 'If RolePermissions is empty → Permissions did NOT save!';
PRINT 'If MenuAccess is empty → MenuAccess did NOT auto-create!';
PRINT 'If API query returns empty → User has no permissions!';
PRINT '============================================================================';
