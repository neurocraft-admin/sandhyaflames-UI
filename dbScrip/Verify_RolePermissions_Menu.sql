-- =============================================
-- Verify Role Permissions Menu Item
-- =============================================

USE [sandhyaflames]
GO

-- Check if Role Permissions menu item exists
SELECT 
    MenuId,
    Name,
    DisplayName,
    Url,
    Icon,
    ParentMenuId,
    SortOrder,
    ResourceId,
    IsActive
FROM MenuItems
WHERE Url = '/role-permissions';

-- Check if Admin parent menu exists
SELECT 
    MenuId,
    Name,
    DisplayName,
    Url,
    Icon,
    ParentMenuId,
    SortOrder
FROM MenuItems
WHERE Name = 'Admin' AND Url IS NULL;

-- Show all menu items under Admin (to see the structure)
SELECT 
    m.MenuId,
    m.Name,
    m.DisplayName,
    m.Url,
    m.ParentMenuId,
    m.SortOrder,
    parent.Name as ParentName
FROM MenuItems m
LEFT JOIN MenuItems parent ON m.ParentMenuId = parent.MenuId
WHERE parent.Name = 'Admin' OR (m.Name = 'Admin' AND m.Url IS NULL)
ORDER BY m.SortOrder;
