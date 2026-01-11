-- ============================================================================
-- QUICK VERIFICATION QUERIES - Production Database
-- ============================================================================
-- Run these queries to verify production database state after migration
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '========================================';
PRINT 'PRODUCTION DATABASE VERIFICATION';
PRINT '========================================';
PRINT '';

-- ============================================================================
-- 1. CHECK ADMIN USER
-- ============================================================================
PRINT '1. ADMIN USER STATUS:';
PRINT '--------------------';
SELECT 
    u.UserId,
    u.Username,
    u.FullName,
    u.Email,
    r.RoleName,
    u.IsActive,
    u.CreatedDate
FROM Users u
LEFT JOIN Roles r ON u.RoleId = r.RoleId
WHERE u.Username = 'admin';

IF @@ROWCOUNT = 0
    PRINT '✗ WARNING: No admin user found!';
ELSE
    PRINT '✓ Admin user exists';

PRINT '';

-- ============================================================================
-- 2. CHECK ALL USERS
-- ============================================================================
PRINT '2. ALL USERS IN SYSTEM:';
PRINT '-----------------------';
SELECT 
    UserId,
    Username,
    FullName,
    Email,
    RoleId,
    IsActive
FROM Users
ORDER BY UserId;

DECLARE @TotalUsers INT = @@ROWCOUNT;
PRINT 'Total Users: ' + CAST(@TotalUsers AS VARCHAR(10));
PRINT '✓ Should be 1 (admin only) for fresh production';
PRINT '';

-- ============================================================================
-- 3. CHECK ROLES
-- ============================================================================
PRINT '3. ROLES IN SYSTEM:';
PRINT '-------------------';
SELECT 
    RoleId,
    RoleName,
    Description,
    IsActive
FROM Roles
ORDER BY RoleId;

PRINT '';

-- ============================================================================
-- 4. CHECK ROLE PERMISSIONS (If exists)
-- ============================================================================
IF OBJECT_ID('RolePermissions', 'U') IS NOT NULL
BEGIN
    PRINT '4. ADMIN ROLE PERMISSIONS:';
    PRINT '--------------------------';
    
    DECLARE @AdminRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'Admin');
    
    IF @AdminRoleId IS NOT NULL
    BEGIN
        SELECT 
            COUNT(*) as TotalPermissions,
            SUM(CASE WHEN CanView = 1 THEN 1 ELSE 0 END) as ViewPermissions,
            SUM(CASE WHEN CanCreate = 1 THEN 1 ELSE 0 END) as CreatePermissions,
            SUM(CASE WHEN CanEdit = 1 THEN 1 ELSE 0 END) as EditPermissions,
            SUM(CASE WHEN CanDelete = 1 THEN 1 ELSE 0 END) as DeletePermissions
        FROM RolePermissions
        WHERE RoleId = @AdminRoleId;
        
        PRINT '✓ Admin permissions configured';
    END
    
    PRINT '';
END

-- ============================================================================
-- 5. CHECK TRANSACTIONAL DATA (Should be empty)
-- ============================================================================
PRINT '5. TRANSACTIONAL DATA (Should all be 0):';
PRINT '----------------------------------------';

DECLARE @DeliveryCount INT = 0, @PurchaseCount INT = 0, @ExpenseCount INT = 0;

IF OBJECT_ID('DailyDelivery', 'U') IS NOT NULL
    SELECT @DeliveryCount = COUNT(*) FROM DailyDelivery;

IF OBJECT_ID('Purchase', 'U') IS NOT NULL
    SELECT @PurchaseCount = COUNT(*) FROM Purchase;

IF OBJECT_ID('Expenses', 'U') IS NOT NULL
    SELECT @ExpenseCount = COUNT(*) FROM Expenses;

PRINT 'Daily Deliveries: ' + CAST(@DeliveryCount AS VARCHAR(10));
PRINT 'Purchases: ' + CAST(@PurchaseCount AS VARCHAR(10));
PRINT 'Expenses: ' + CAST(@ExpenseCount AS VARCHAR(10));

IF @DeliveryCount = 0 AND @PurchaseCount = 0 AND @ExpenseCount = 0
    PRINT '✓ All transactional data cleaned';
ELSE
    PRINT '⚠ WARNING: Some transactional data still exists';

PRINT '';

-- ============================================================================
-- 6. CHECK MASTER DATA (Should be empty or minimal)
-- ============================================================================
PRINT '6. MASTER DATA (Should all be 0 for fresh start):';
PRINT '-------------------------------------------------';

DECLARE @CustomerCount INT = 0, @VendorCount INT = 0, @DriverCount INT = 0, @VehicleCount INT = 0;

IF OBJECT_ID('Customers', 'U') IS NOT NULL
    SELECT @CustomerCount = COUNT(*) FROM Customers;

IF OBJECT_ID('Vendors', 'U') IS NOT NULL
    SELECT @VendorCount = COUNT(*) FROM Vendors;

IF OBJECT_ID('Drivers', 'U') IS NOT NULL
    SELECT @DriverCount = COUNT(*) FROM Drivers;

IF OBJECT_ID('Vehicles', 'U') IS NOT NULL
    SELECT @VehicleCount = COUNT(*) FROM Vehicles;

PRINT 'Customers: ' + CAST(@CustomerCount AS VARCHAR(10));
PRINT 'Vendors: ' + CAST(@VendorCount AS VARCHAR(10));
PRINT 'Drivers: ' + CAST(@DriverCount AS VARCHAR(10));
PRINT 'Vehicles: ' + CAST(@VehicleCount AS VARCHAR(10));

IF @CustomerCount = 0 AND @VendorCount = 0 AND @DriverCount = 0 AND @VehicleCount = 0
    PRINT '✓ All master data cleaned';
ELSE
    PRINT '⚠ INFO: Some master data exists (may be intentional)';

PRINT '';

-- ============================================================================
-- 7. CHECK PRODUCTS (Structure should exist, stock should be 0)
-- ============================================================================
PRINT '7. PRODUCT INVENTORY:';
PRINT '---------------------';

IF OBJECT_ID('Products', 'U') IS NOT NULL
BEGIN
    SELECT 
        ProductId,
        ProductName,
        CategoryId,
        SubCategoryId,
        ISNULL(EmptyStock, 0) as EmptyStock,
        ISNULL(FilledStock, 0) as FilledStock,
        ISNULL(DamagedStock, 0) as DamagedStock,
        IsActive
    FROM Products
    WHERE IsActive = 1
    ORDER BY ProductId;
    
    DECLARE @TotalStock INT = (
        SELECT SUM(ISNULL(EmptyStock, 0) + ISNULL(FilledStock, 0) + ISNULL(DamagedStock, 0))
        FROM Products
    );
    
    PRINT 'Total Stock Across All Products: ' + CAST(ISNULL(@TotalStock, 0) AS VARCHAR(10));
    
    IF ISNULL(@TotalStock, 0) = 0
        PRINT '✓ All product stock levels at zero (ready for fresh start)';
    ELSE
        PRINT '⚠ INFO: Some stock exists (may need adjustment)';
END
ELSE
BEGIN
    PRINT '⚠ Products table not found';
END

PRINT '';

-- ============================================================================
-- 8. DATABASE SIZE AND SPACE
-- ============================================================================
PRINT '8. DATABASE SIZE:';
PRINT '-----------------';

EXEC sp_spaceused;

PRINT '';

-- ============================================================================
-- 9. CHECK TABLE ROW COUNTS (All tables)
-- ============================================================================
PRINT '9. ALL TABLE ROW COUNTS:';
PRINT '------------------------';

SELECT 
    t.NAME AS TableName,
    p.rows AS RowCounts
FROM 
    sys.tables t
    INNER JOIN sys.indexes i ON t.OBJECT_ID = i.object_id
    INNER JOIN sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
WHERE 
    t.is_ms_shipped = 0
    AND i.index_id < 2
GROUP BY 
    t.Name, p.Rows
ORDER BY 
    p.rows DESC, t.Name;

PRINT '';
PRINT '========================================';
PRINT 'VERIFICATION COMPLETE';
PRINT '========================================';
PRINT '';
PRINT 'EXPECTED STATE FOR CLEAN PRODUCTION:';
PRINT '- Users: 1 (admin only)';
PRINT '- Roles: 1+ (Admin and any other defined roles)';
PRINT '- Customers: 0';
PRINT '- Vendors: 0';
PRINT '- Drivers: 0';
PRINT '- Vehicles: 0';
PRINT '- Deliveries: 0';
PRINT '- Purchases: 0';
PRINT '- Products: Structure exists, stock = 0';
PRINT '';

GO
