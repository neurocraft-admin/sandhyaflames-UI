-- Grant menu access to all roles for all menu items
USE [sandhyaflames]
GO

-- Check current MenuAccess for the user's role
SELECT 
    r.RoleId,
    r.RoleName,
    COUNT(ma.MenuId) AS MenuAccessCount
FROM Roles r
LEFT JOIN MenuAccess ma ON r.RoleId = ma.RoleId
WHERE r.IsActive = 1
GROUP BY r.RoleId, r.RoleName
ORDER BY r.RoleId;

PRINT '--- Adding missing MenuAccess entries ---';

-- Add MenuAccess for all active roles to all menu items
INSERT INTO MenuAccess (MenuId, RoleId)
SELECT m.MenuId, r.RoleId
FROM MenuItems m
CROSS JOIN Roles r
WHERE r.IsActive = 1
AND NOT EXISTS (
    SELECT 1 
    FROM MenuAccess ma 
    WHERE ma.MenuId = m.MenuId AND ma.RoleId = r.RoleId
);

PRINT '✅ MenuAccess entries added';

-- Verify MenuAccess counts after insert
SELECT 
    r.RoleId,
    r.RoleName,
    COUNT(ma.MenuId) AS MenuAccessCount
FROM Roles r
LEFT JOIN MenuAccess ma ON r.RoleId = ma.RoleId
WHERE r.IsActive = 1
GROUP BY r.RoleId, r.RoleName
ORDER BY r.RoleId;
