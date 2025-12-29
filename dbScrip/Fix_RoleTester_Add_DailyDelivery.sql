-- ============================================================================
-- Grant Daily Delivery Submenu Access to RoleTester
-- ============================================================================
-- PROBLEM: RoleTester has parent "Delivery" but not child "Daily Delivery"
-- SOLUTION: Grant access to MenuId 6 (Daily Delivery)
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Adding Daily Delivery Menu Access to RoleTester';
PRINT '============================================================================';
PRINT '';

-- Check current access
PRINT 'BEFORE - Current MenuAccess for RoleTester:';
SELECT 
    ma.MenuId,
    mi.DisplayName,
    mi.ParentMenuId,
    CASE WHEN mi.ParentMenuId IS NULL THEN 'Parent' ELSE 'Child' END AS Level
FROM MenuAccess ma
JOIN MenuItems mi ON ma.MenuId = mi.MenuId
WHERE ma.RoleId = 6
ORDER BY mi.MenuId;

PRINT '';

-- Add Daily Delivery menu item
PRINT 'Adding Daily Delivery (MenuId=6) access...';

IF NOT EXISTS (SELECT 1 FROM MenuAccess WHERE RoleId = 6 AND MenuId = 6)
BEGIN
    INSERT INTO MenuAccess (RoleId, MenuId)
    VALUES (6, 6);  -- Daily Delivery
    
    PRINT '✅ Granted access to Daily Delivery';
END
ELSE
    PRINT '⚠️  Daily Delivery access already exists';

PRINT '';

-- Verify
PRINT 'AFTER - Updated MenuAccess for RoleTester:';
SELECT 
    ma.MenuId,
    mi.DisplayName,
    mi.ParentMenuId,
    CASE WHEN mi.ParentMenuId IS NULL THEN 'Parent' ELSE 'Child' END AS Level
FROM MenuAccess ma
JOIN MenuItems mi ON ma.MenuId = mi.MenuId
WHERE ma.RoleId = 6
ORDER BY mi.MenuId;

PRINT '';
PRINT '============================================================================';
PRINT '✅ Fix Completed!';
PRINT '';
PRINT 'Expected Menu in UI:';
PRINT '  - Dashboard';
PRINT '  - Delivery';
PRINT '    └── Daily Delivery  ← Should now appear!';
PRINT '';
PRINT '🔄 Refresh the browser!';
PRINT '============================================================================';
