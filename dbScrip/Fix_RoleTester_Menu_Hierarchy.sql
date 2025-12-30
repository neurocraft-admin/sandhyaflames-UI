-- ============================================================================
-- Fix Menu Hierarchy - Grant Parent Menu Access
-- ============================================================================
-- PROBLEM: RoleTester can see menu items but not parent menus
-- SOLUTION: Grant access to parent "Delivery" menu to show submenu
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Diagnosing Menu Hierarchy Issue';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- 1. Show Menu Structure
-- ============================================================================
PRINT 'Current Menu Structure:';
SELECT 
    mi.MenuId,
    mi.DisplayName,
    mi.Url,
    mi.ParentMenuId,
    CASE WHEN mi.ParentMenuId IS NULL THEN 'Top Level' ELSE 'Submenu' END AS MenuType
FROM MenuItems mi
ORDER BY 
    CASE WHEN mi.ParentMenuId IS NULL THEN mi.MenuId ELSE mi.ParentMenuId END,
    CASE WHEN mi.ParentMenuId IS NULL THEN 0 ELSE 1 END,
    mi.MenuId;

PRINT '';

-- ============================================================================
-- 2. Show RoleTester Current MenuAccess
-- ============================================================================
PRINT 'RoleTester (RoleId=6) Current Menu Access:';
SELECT 
    ma.MenuAccessId,
    ma.RoleId,
    ma.MenuId,
    mi.DisplayName AS MenuTitle,
    mi.ParentMenuId,
    CASE WHEN mi.ParentMenuId IS NULL THEN 'Top Level' ELSE 'Submenu' END AS MenuType
FROM MenuAccess ma
JOIN MenuItems mi ON ma.MenuId = mi.MenuId
WHERE ma.RoleId = 6
ORDER BY mi.MenuId;

PRINT '';

-- ============================================================================
-- 3. Find Missing Parent Menu
-- ============================================================================
PRINT 'Missing Parent Menus (children granted but parent not):';
SELECT DISTINCT
    parent.MenuId,
    parent.DisplayName AS ParentMenuTitle,
    parent.Url AS ParentUrl
FROM MenuAccess ma
JOIN MenuItems child ON ma.MenuId = child.MenuId
JOIN MenuItems parent ON child.ParentMenuId = parent.MenuId
WHERE ma.RoleId = 6
  AND parent.MenuId NOT IN (
      SELECT MenuId FROM MenuAccess WHERE RoleId = 6
  );

PRINT '';

-- ============================================================================
-- 4. FIX: Grant Access to Parent Menus
-- ============================================================================
PRINT 'Granting access to parent menus...';

-- Insert parent menu access for any child menu that has access
INSERT INTO MenuAccess (RoleId, MenuId)
SELECT DISTINCT
    6 AS RoleId,
    parent.MenuId
FROM MenuAccess ma
JOIN MenuItems child ON ma.MenuId = child.MenuId
JOIN MenuItems parent ON child.ParentMenuId = parent.MenuId
WHERE ma.RoleId = 6
  AND parent.MenuId NOT IN (
      SELECT MenuId FROM MenuAccess WHERE RoleId = 6
  );

DECLARE @ParentRowsAdded INT = @@ROWCOUNT;
PRINT '✅ Granted access to ' + CAST(@ParentRowsAdded AS NVARCHAR(10)) + ' parent menu(s)';

PRINT '';

-- ============================================================================
-- 5. AFTER: Verify Complete Menu Access
-- ============================================================================
PRINT 'AFTER - RoleTester Complete Menu Access:';
SELECT 
    mi.MenuId,
    mi.DisplayName,
    mi.Url,
    mi.ParentMenuId,
    CASE WHEN mi.ParentMenuId IS NULL THEN 'Top Level' ELSE 'Submenu' END AS MenuType,
    CASE 
        WHEN ma.MenuAccessId IS NOT NULL THEN '✅ Granted'
        ELSE '❌ Not Granted'
    END AS AccessStatus
FROM MenuItems mi
LEFT JOIN MenuAccess ma ON mi.MenuId = ma.MenuId AND ma.RoleId = 6
ORDER BY 
    CASE WHEN mi.ParentMenuId IS NULL THEN mi.MenuId ELSE mi.ParentMenuId END,
    CASE WHEN mi.ParentMenuId IS NULL THEN 0 ELSE 1 END,
    mi.MenuId;

PRINT '';

-- ============================================================================
-- 6. Test: Show Expected Menu for roletester User
-- ============================================================================
PRINT 'Expected Menu for roletester@sandhyaflames.in (UserId=18, RoleId=6):';
SELECT 
    mi.MenuId,
    mi.DisplayName,
    mi.Url,
    mi.Icon,
    mi.ParentMenuId,
    CASE WHEN mi.ParentMenuId IS NULL THEN 'Parent' ELSE 'Child' END AS Level
FROM Users u
JOIN MenuAccess ma ON u.RoleId = ma.RoleId
JOIN MenuItems mi ON ma.MenuId = mi.MenuId
WHERE u.UserId = 18
  AND u.IsActive = 1
ORDER BY 
    CASE WHEN mi.ParentMenuId IS NULL THEN mi.MenuId ELSE mi.ParentMenuId END,
    CASE WHEN mi.ParentMenuId IS NULL THEN 0 ELSE 1 END,
    mi.MenuId;

PRINT '';
PRINT '============================================================================';
PRINT '✅ Menu Hierarchy Fix Completed!';
PRINT '';
PRINT 'Expected Menu Structure in UI:';
PRINT '  - Dashboard (top level)';
PRINT '  - Delivery (parent)';
PRINT '    └── Daily Delivery (child)';
PRINT '';
PRINT '🔄 Refresh the browser and check the menu!';
PRINT '============================================================================';
