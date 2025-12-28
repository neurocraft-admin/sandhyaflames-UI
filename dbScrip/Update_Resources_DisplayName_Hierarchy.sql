-- ============================================================================
-- Update Resources DisplayName to Show Menu Hierarchy
-- ============================================================================
-- PURPOSE: Show parent menu context in Role Permissions page
-- EXAMPLE: "Daily Delivery" → "Delivery > Daily Delivery"
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Updating Resources DisplayName with Menu Hierarchy';
PRINT '============================================================================';
PRINT '';

-- Show current Resources
PRINT 'BEFORE - Current Resources:';
SELECT 
    r.ResourceId,
    r.ResourceName,
    r.DisplayName AS CurrentDisplayName,
    mi.MenuId,
    mi.DisplayName AS MenuDisplayName,
    parent.DisplayName AS ParentMenuName
FROM Resources r
LEFT JOIN MenuItems mi ON r.ResourceName = mi.Name OR r.ResourceName = REPLACE(mi.DisplayName, ' ', '')
LEFT JOIN MenuItems parent ON mi.ParentMenuId = parent.MenuId
ORDER BY r.ResourceId;

PRINT '';

-- Update DisplayName to show hierarchy for child menus
PRINT 'Updating DisplayName for submenu resources...';

-- Daily Delivery (under Delivery parent)
UPDATE Resources 
SET DisplayName = 'Delivery > Daily Delivery'
WHERE ResourceName = 'DailyDelivery';

-- Commercial Deliveries (under Delivery parent)
UPDATE Resources 
SET DisplayName = 'Delivery > Commercial Deliveries'
WHERE ResourceName = 'CommercialDeliveries';

-- Users (under Admin parent)
UPDATE Resources 
SET DisplayName = 'Admin > Users'
WHERE ResourceName = 'Users';

-- Roles (under Admin parent)
UPDATE Resources 
SET DisplayName = 'Admin > Roles'
WHERE ResourceName = 'Roles';

-- Drivers (under Masters parent)
UPDATE Resources 
SET DisplayName = 'Masters > Drivers'
WHERE ResourceName = 'Drivers';

-- Vehicles (under Masters parent)
UPDATE Resources 
SET DisplayName = 'Masters > Vehicles'
WHERE ResourceName = 'Vehicles';

-- Vehicle Assignment (under Masters parent)
UPDATE Resources 
SET DisplayName = 'Masters > Vehicle Assignment'
WHERE ResourceName = 'VehicleAssignment';

-- Products (under Masters parent)
UPDATE Resources 
SET DisplayName = 'Masters > Products'
WHERE ResourceName = 'Products';

-- Product Pricing (under Masters parent)
UPDATE Resources 
SET DisplayName = 'Masters > Product Pricing'
WHERE ResourceName = 'ProductPricing';

-- Customers (under Customer parent)
UPDATE Resources 
SET DisplayName = 'Customer > Customers'
WHERE ResourceName = 'Customers';

-- Customer Credit (under Customer parent)
UPDATE Resources 
SET DisplayName = 'Customer > Customer Credit'
WHERE ResourceName = 'CustomerCredit';

-- Purchase Entry (under Purchase & Stocks parent)
UPDATE Resources 
SET DisplayName = 'Purchase & Stocks > Purchase Entry'
WHERE ResourceName = 'PurchaseEntry';

-- Stock Register (under Purchase & Stocks parent)
UPDATE Resources 
SET DisplayName = 'Purchase & Stocks > Stock Register'
WHERE ResourceName = 'StockRegister';

PRINT '✅ Updated DisplayNames for submenu resources';

PRINT '';

-- Show updated Resources
PRINT 'AFTER - Updated Resources:';
SELECT 
    ResourceId,
    ResourceName,
    DisplayName
FROM Resources
ORDER BY DisplayName;

PRINT '';
PRINT '============================================================================';
PRINT '✅ DisplayName Update Completed!';
PRINT '';
PRINT 'In Role Permissions page, you will now see:';
PRINT '  - Delivery > Daily Delivery';
PRINT '  - Delivery > Commercial Deliveries';
PRINT '  - Admin > Users';
PRINT '  - Masters > Drivers';
PRINT '  etc.';
PRINT '';
PRINT '🔄 Refresh the Role Permissions page to see the changes!';
PRINT '============================================================================';
