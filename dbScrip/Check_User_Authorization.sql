-- Check which users/roles have MenuAccess and which don't
USE [sandhyaflames]
GO

-- 1. Check MenuAccess count per role
SELECT 
    r.RoleId,
    r.RoleName,
    COUNT(ma.MenuId) AS MenuAccessCount,
    (SELECT COUNT(*) FROM MenuItems WHERE IsActive = 1) AS TotalMenuItems,
    CASE 
        WHEN COUNT(ma.MenuId) = 0 THEN '❌ NO ACCESS'
        WHEN COUNT(ma.MenuId) < (SELECT COUNT(*) FROM MenuItems WHERE IsActive = 1) THEN '⚠️ PARTIAL ACCESS'
        ELSE '✅ FULL ACCESS'
    END AS AccessStatus
FROM Roles r
LEFT JOIN MenuAccess ma ON r.RoleId = ma.RoleId
WHERE r.IsActive = 1
GROUP BY r.RoleId, r.RoleName
ORDER BY r.RoleId;

-- 2. Check which users will have authorization issues
SELECT 
    u.UserId,
    u.FullName,
    u.Email,
    r.RoleName,
    COUNT(ma.MenuId) AS MenuAccessCount,
    CASE 
        WHEN COUNT(ma.MenuId) = 0 THEN '❌ WILL FAIL - No MenuAccess'
        WHEN COUNT(ma.MenuId) < (SELECT COUNT(*) FROM MenuItems WHERE IsActive = 1) THEN '⚠️ Partial menu access'
        ELSE '✅ Full access'
    END AS LoginStatus
FROM Users u
INNER JOIN Roles r ON u.RoleId = r.RoleId
LEFT JOIN MenuAccess ma ON r.RoleId = ma.RoleId
WHERE u.IsActive = 1
GROUP BY u.UserId, u.FullName, u.Email, r.RoleName
ORDER BY COUNT(ma.MenuId) ASC;

-- 3. Show which specific roles are missing MenuAccess
SELECT 
    r.RoleId,
    r.RoleName,
    'Missing MenuAccess entries' AS Issue
FROM Roles r
LEFT JOIN MenuAccess ma ON r.RoleId = ma.RoleId
WHERE r.IsActive = 1
GROUP BY r.RoleId, r.RoleName
HAVING COUNT(ma.MenuId) = 0;
