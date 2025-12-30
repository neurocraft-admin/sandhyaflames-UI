-- ============================================================================
-- Check Biller Role (RoleId=7) Permissions
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Checking Biller Role Permissions';
PRINT '============================================================================';
PRINT '';

-- 1. Check Biller role details
PRINT '1. Biller Role Details:';
SELECT RoleId, RoleName, IsActive, CreatedAt
FROM Roles
WHERE RoleId = 7;

PRINT '';

-- 2. Check RolePermissions for Biller (RoleId=7)
PRINT '2. Biller Role Permissions (from RolePermissions table):';
SELECT 
    rp.RolePermissionId,
    rp.RoleId,
    rp.ResourceId,
    rp.ResourceKey,
    rp.PermissionMask,
    r.ResourceName,
    r.DisplayName,
    CASE WHEN (rp.PermissionMask & 1) = 1 THEN 'Yes' ELSE 'No' END AS CanView,
    CASE WHEN (rp.PermissionMask & 2) = 2 THEN 'Yes' ELSE 'No' END AS CanCreate,
    CASE WHEN (rp.PermissionMask & 4) = 4 THEN 'Yes' ELSE 'No' END AS CanUpdate,
    CASE WHEN (rp.PermissionMask & 8) = 8 THEN 'Yes' ELSE 'No' END AS CanDelete
FROM RolePermissions rp
JOIN Resources r ON rp.ResourceId = r.ResourceId
WHERE rp.RoleId = 7;

PRINT '';

-- 3. Check MenuAccess for Biller (RoleId=7)
PRINT '3. Biller Menu Access:';
SELECT 
    ma.MenuAccessId,
    ma.RoleId,
    ma.MenuId,
    mi.DisplayName AS MenuName,
    mi.Url,
    mi.ParentMenuId,
    CASE WHEN mi.ParentMenuId IS NULL THEN 'Parent' ELSE 'Child' END AS MenuType
FROM MenuAccess ma
JOIN MenuItems mi ON ma.MenuId = mi.MenuId
WHERE ma.RoleId = 7
ORDER BY 
    CASE WHEN mi.ParentMenuId IS NULL THEN mi.MenuId ELSE mi.ParentMenuId END,
    CASE WHEN mi.ParentMenuId IS NULL THEN 0 ELSE 1 END;

PRINT '';

-- 4. Also check RoleTester (RoleId=6) for comparison
PRINT '4. RoleTester Role Permissions (for comparison):';
SELECT 
    rp.RoleId,
    rp.ResourceKey,
    rp.PermissionMask,
    r.DisplayName,
    CASE WHEN (rp.PermissionMask & 1) = 1 THEN 'Yes' ELSE 'No' END AS CanView
FROM RolePermissions rp
JOIN Resources r ON rp.ResourceId = r.ResourceId
WHERE rp.RoleId = 6;

PRINT '';

-- 5. Check what API returns for UserId=18
PRINT '5. What API returns for roletester user (UserId=18):';
DECLARE @UserId INT = 18;
DECLARE @RoleId INT;

SELECT @RoleId = RoleId FROM Users WHERE UserId = @UserId;

PRINT '   UserId: ' + CAST(@UserId AS NVARCHAR(10));
PRINT '   RoleId: ' + CAST(@RoleId AS NVARCHAR(10));

SELECT 
    rp.ResourceKey AS resourceKey,
    rp.PermissionMask AS permissionMask
FROM Users u
JOIN RolePermissions rp ON u.RoleId = rp.RoleId
WHERE u.UserId = @UserId
  AND u.IsActive = 1;

PRINT '';
PRINT '============================================================================';
PRINT 'Summary:';
PRINT '  - If Biller (RoleId=7) has no rows in RolePermissions → NO PERMISSIONS ❌';
PRINT '  - If Biller (RoleId=7) has no rows in MenuAccess → NO MENU ACCESS ❌';
PRINT '  - roletester user needs permissions to login and see menus';
PRINT '============================================================================';
