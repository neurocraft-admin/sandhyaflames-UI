-- ============================================================================
-- Fix roletester User RoleId Mapping
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Diagnosing roletester Login Issue';
PRINT '============================================================================';
PRINT '';

-- 1. Check roletester user
PRINT '1. roletester User Details:';
SELECT UserId, Email, RoleId, IsActive
FROM Users
WHERE Email = 'roletester@sandhyaflames.in';

PRINT '';

-- 2. Check what RoleId 6 means in each table
PRINT '2. RoleId 6 in Roles table:';
SELECT RoleId, RoleName, IsActive
FROM Roles
WHERE RoleId = 6;

PRINT '';

PRINT '3. RoleId 6 in UserRoles table (old):';
SELECT RoleId, RoleName, IsActive
FROM UserRoles
WHERE RoleId = 6;

PRINT '';

-- 3. Check all user RoleIds
PRINT '4. All Users with their RoleIds:';
SELECT 
    u.UserId,
    u.Email,
    u.RoleId AS CurrentRoleId,
    r.RoleName AS NewRoleName,
    ur.RoleName AS OldRoleName
FROM Users u
LEFT JOIN Roles r ON u.RoleId = r.RoleId
LEFT JOIN UserRoles ur ON u.RoleId = ur.RoleId
ORDER BY u.UserId;

PRINT '';
PRINT '============================================================================';
PRINT 'Analysis:';
PRINT '  - roletester user has RoleId = ?';
PRINT '  - This RoleId now references Roles table, not UserRoles';
PRINT '  - If RoleId 6 in Roles = "RoleTester" ✅ CORRECT';
PRINT '  - If RoleId 6 in Roles = something else ❌ NEED TO FIX';
PRINT '============================================================================';
