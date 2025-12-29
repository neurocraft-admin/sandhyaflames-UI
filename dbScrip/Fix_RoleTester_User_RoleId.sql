-- ============================================================================
-- Fix roletester User - Assign Correct RoleId
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Fixing roletester User RoleId';
PRINT '============================================================================';
PRINT '';

-- Current state
PRINT 'BEFORE - roletester current role:';
SELECT UserId, Email, RoleId, 
       (SELECT RoleName FROM Roles WHERE RoleId = Users.RoleId) AS RoleName
FROM Users
WHERE Email = 'roletester@sandhyaflames.in';

PRINT '';

-- Fix: Update to RoleId = 6 (RoleTester)
PRINT 'Updating roletester to RoleId = 6 (RoleTester)...';

UPDATE Users
SET RoleId = 6  -- RoleTester role
WHERE Email = 'roletester@sandhyaflames.in';

PRINT '✅ Updated roletester user';

PRINT '';

-- Verify
PRINT 'AFTER - roletester updated role:';
SELECT UserId, Email, RoleId, 
       (SELECT RoleName FROM Roles WHERE RoleId = Users.RoleId) AS RoleName
FROM Users
WHERE Email = 'roletester@sandhyaflames.in';

PRINT '';

-- Verify permissions exist
PRINT 'Verifying RoleTester (RoleId=6) permissions:';
SELECT 
    r.ResourceName,
    r.DisplayName,
    rp.PermissionMask,
    CASE WHEN (rp.PermissionMask & 1) = 1 THEN 'Yes' ELSE 'No' END AS CanView,
    CASE WHEN (rp.PermissionMask & 2) = 2 THEN 'Yes' ELSE 'No' END AS CanCreate,
    CASE WHEN (rp.PermissionMask & 4) = 4 THEN 'Yes' ELSE 'No' END AS CanUpdate,
    CASE WHEN (rp.PermissionMask & 8) = 8 THEN 'Yes' ELSE 'No' END AS CanDelete
FROM RolePermissions rp
JOIN Resources r ON rp.ResourceId = r.ResourceId
WHERE rp.RoleId = 6;

PRINT '';

-- Verify menu access
PRINT 'Verifying RoleTester (RoleId=6) menu access:';
SELECT 
    mi.MenuId,
    mi.DisplayName,
    mi.Url,
    CASE WHEN mi.ParentMenuId IS NULL THEN 'Parent' ELSE 'Child' END AS MenuType
FROM MenuAccess ma
JOIN MenuItems mi ON ma.MenuId = mi.MenuId
WHERE ma.RoleId = 6
ORDER BY 
    CASE WHEN mi.ParentMenuId IS NULL THEN mi.MenuId ELSE mi.ParentMenuId END,
    CASE WHEN mi.ParentMenuId IS NULL THEN 0 ELSE 1 END;

PRINT '';
PRINT '============================================================================';
PRINT '✅ roletester user fixed!';
PRINT '';
PRINT 'roletester@sandhyaflames.in now has:';
PRINT '  - RoleId: 6 (RoleTester)';
PRINT '  - Permissions: As configured in Role Permissions page';
PRINT '  - Menu Access: Dashboard + Delivery > Daily Delivery';
PRINT '';
PRINT '🔄 Try logging in again!';
PRINT '============================================================================';
