-- ============================================================================
-- Remove "Delivery Mapping" from Menu
-- This menu item should not be visible as it's accessed via "Map Customers" button
-- ============================================================================

USE [sandhyaflames];
GO

-- Find Delivery Mapping menu item
SELECT MenuId, DisplayName, Url, ParentMenuId, IsActive
FROM MenuItems
WHERE DisplayName LIKE '%Delivery Mapping%' OR Url LIKE '%DeliveryMapping%';

-- Delete from MenuAccess first (foreign key)
DELETE FROM MenuAccess
WHERE MenuId IN (
    SELECT MenuId 
    FROM MenuItems 
    WHERE DisplayName LIKE '%Delivery Mapping%' OR Url LIKE '%DeliveryMapping%'
);

-- Delete the menu item
DELETE FROM MenuItems
WHERE DisplayName LIKE '%Delivery Mapping%' OR Url LIKE '%DeliveryMapping%';

PRINT '✅ Delivery Mapping menu removed';
PRINT 'Note: The page is still accessible via "Map Customers" button in Commercial Deliveries';
