-- =============================================
-- SEED DATA FOR MENU AND PERMISSIONS
-- Date: 2025-12-26
-- Purpose: Initial data setup for resources, menus, and permissions
-- =============================================

USE [sandhyaflames]
GO

-- =============================================
-- STEP 1: Insert Resources
-- =============================================
-- Clear existing resources first to avoid FK conflicts
DELETE FROM Resources;

SET IDENTITY_INSERT Resources ON;

INSERT INTO Resources (ResourceId, ResourceName, DisplayName, Description, IsActive)
VALUES
    (1, 'Dashboard', 'Dashboard', 'Main dashboard page', 1),
    (2, 'Users', 'Users', 'User management', 1),
    (3, 'Roles', 'Roles', 'Role management', 1),
    (4, 'DailyDelivery', 'Daily Delivery', 'Daily delivery management', 1),
    (5, 'DeliveryMapping', 'Delivery Mapping', 'Delivery route mapping', 1),
    (6, 'CommercialDeliveries', 'Commercial Deliveries', 'Commercial delivery tracking', 1),
    (7, 'PurchaseEntry', 'Purchase Entry', 'Purchase entry management', 1),
    (8, 'StockRegister', 'Stock Register', 'Stock inventory management', 1),
    (9, 'IncomeExpense', 'Income/Expense', 'Income and expense tracking', 1),
    (10, 'Drivers', 'Drivers', 'Driver management', 1),
    (11, 'Vehicles', 'Vehicles', 'Vehicle management', 1),
    (12, 'VehicleAssignment', 'Vehicle Assignment', 'Vehicle-driver assignment', 1),
    (13, 'Products', 'Products', 'Product catalog management', 1),
    (14, 'ProductPricing', 'Product Pricing', 'Product pricing management', 1),
    (15, 'Customers', 'Customers', 'Customer management', 1),
    (16, 'CustomerCredit', 'Customer Credit', 'Customer credit management', 1);

SET IDENTITY_INSERT Resources OFF;

PRINT '✅ Resources inserted (16 items)';
GO

-- =============================================
-- STEP 2: Insert Menu Items (Hierarchical Structure)
-- =============================================
-- Clear existing menu items
DELETE FROM MenuItems;

SET IDENTITY_INSERT MenuItems ON;

INSERT INTO MenuItems (MenuId, Name, DisplayName, Url, Icon, ParentMenuId, ResourceId, SortOrder, IsActive)
VALUES
    -- Top Level Items
    (1, 'Dashboard', 'Dashboard', '/dashboard', 'cil-speedometer', NULL, 1, 0, 1),
    
    -- Admin Section (Parent)
    (2, 'Admin', 'Admin', NULL, 'cil-shield-alt', NULL, NULL, 1, 1),
    (3, 'Users', 'Users', '/users', 'cil-user', 2, 2, 0, 1),
    (4, 'Roles', 'Roles', '/roles', 'cil-people', 2, 3, 1, 1),
    
    -- Delivery Section (Parent)
    (5, 'Delivery', 'Delivery', NULL, 'cil-truck', NULL, NULL, 2, 1),
    (6, 'DailyDelivery', 'Daily Delivery', '/DailyDelivery', 'cil-calendar', 5, 4, 0, 1),
    (7, 'DeliveryMapping', 'Delivery Mapping', '/DeliveryMapping', 'cil-map', 5, 5, 1, 1),
    (8, 'CommercialDeliveries', 'Commercial Deliveries', '/CommercialDeliveries', 'cil-briefcase', 5, 6, 2, 1),
    
    -- Purchase & Stocks Section (Parent)
    (9, 'PurchaseStocks', 'Purchase & Stocks', NULL, 'cil-basket', NULL, NULL, 3, 1),
    (10, 'PurchaseEntry', 'Purchase Entry', '/PurchaseEntry', 'cil-cart', 9, 7, 0, 1),
    (11, 'StockRegister', 'Stock Register', '/StockRegister', 'cil-storage', 9, 8, 1, 1),
    
    -- Income/Expense
    (12, 'IncomeExpense', 'Income/Expense', '/IncomeExpenseForm', 'cil-money', NULL, 9, 4, 1),
    
    -- Masters Section (Parent)
    (13, 'Masters', 'Masters', NULL, 'cil-settings', NULL, NULL, 5, 1),
    (14, 'Drivers', 'Drivers', '/drivers', 'cil-user-follow', 13, 10, 0, 1),
    (15, 'Vehicles', 'Vehicles', '/vehicles', 'cil-car-alt', 13, 11, 1, 1),
    (16, 'VehicleAssignment', 'Vehicle Assignment', '/vehicle-assignment', 'cil-transfer', 13, 12, 2, 1),
    (17, 'Products', 'Products', '/products', 'cil-library', 13, 13, 3, 1),
    (18, 'ProductPricing', 'Product Pricing', '/ProductPricing', 'cil-dollar', 13, 14, 4, 1),
    
    -- Customer Section (Parent)
    (19, 'Customer', 'Customer', NULL, 'cil-people', NULL, NULL, 6, 1),
    (20, 'Customers', 'Customers', '/customers', 'cil-user', 19, 15, 0, 1),
    (21, 'CustomerCredit', 'Customer Credit', '/customer-credit', 'cil-credit-card', 19, 16, 1, 1);

SET IDENTITY_INSERT MenuItems OFF;

PRINT '✅ Menu items inserted (21 items)';
GO

PRINT '✅ Menu items inserted/updated';
GO

-- =============================================
-- STEP 3: Set Permissions for Admin Role (Full Access)
-- Assume RoleId = 1 is Admin
-- =============================================
-- Clear existing admin permissions
DELETE FROM Permissions WHERE RoleId = 1;

-- Insert admin permissions for all resources
INSERT INTO Permissions (RoleId, ResourceId, CanView, CanCreate, CanUpdate, CanDelete, CanExport, CanApprove)
SELECT 
    1 AS RoleId,                    -- Admin Role
    ResourceId,
    1 AS CanView,
    1 AS CanCreate,
    1 AS CanUpdate,
    1 AS CanDelete,
    1 AS CanExport,
    1 AS CanApprove
FROM Resources;

PRINT '✅ Admin permissions set (full access to 16 resources)';
GO

-- =============================================
-- STEP 4: Set Menu Access for Admin Role (All Menus)
-- =============================================
-- Clear existing admin menu access
DELETE FROM MenuAccess WHERE RoleId = 1;

-- Insert menu access for admin
INSERT INTO MenuAccess (MenuId, RoleId)
SELECT MenuId, 1 AS RoleId FROM MenuItems;

PRINT '✅ Admin menu access set (all 21 menus)';
GO

PRINT '';
PRINT '========================================';
PRINT 'Seed Data Inserted Successfully!';
PRINT 'Admin role (RoleId=1) has full access';
PRINT '========================================';
