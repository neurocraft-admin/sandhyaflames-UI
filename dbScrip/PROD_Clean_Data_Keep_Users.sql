-- ============================================================================
-- PRODUCTION DATABASE - CLEANUP DATA (KEEP USERS, ROLES, PERMISSIONS)
-- ============================================================================
-- Purpose: Remove all transactional and test data
-- Keeps: Users, Roles, RolePermissions, Products structure
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '========================================';
PRINT 'Cleaning Production Data...';
PRINT 'Keeping: Users, Roles, Permissions';
PRINT '========================================';
PRINT '';

BEGIN TRANSACTION CleanupTransaction;

BEGIN TRY

    -- ============================================================================
    -- 1. DELETE TRANSACTIONAL DATA
    -- ============================================================================
    PRINT 'Step 1: Cleaning transactional data...';
    
    -- Delete Commercial Deliveries
    IF OBJECT_ID('CommercialDelivery', 'U') IS NOT NULL
    BEGIN
        DELETE FROM CommercialDelivery;
        PRINT '✓ CommercialDelivery cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Daily Deliveries (child tables first to avoid FK constraints)
    IF OBJECT_ID('DailyDeliveryItems', 'U') IS NOT NULL
    BEGIN
        DELETE FROM DailyDeliveryItems;
        PRINT '✓ DailyDeliveryItems cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('DailyDeliveryMetrics', 'U') IS NOT NULL
    BEGIN
        DELETE FROM DailyDeliveryMetrics;
        PRINT '✓ DailyDeliveryMetrics cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('DailyDeliveryDrivers', 'U') IS NOT NULL
    BEGIN
        DELETE FROM DailyDeliveryDrivers;
        PRINT '✓ DailyDeliveryDrivers cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('DailyDeliveries', 'U') IS NOT NULL
    BEGIN
        DELETE FROM DailyDeliveries;
        PRINT '✓ DailyDeliveries cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('DailyDeliveryCustomerMapping', 'U') IS NOT NULL
    BEGIN
        DELETE FROM DailyDeliveryCustomerMapping;
        PRINT '✓ DailyDeliveryCustomerMapping cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('DailyDelivery', 'U') IS NOT NULL
    BEGIN
        DELETE FROM DailyDelivery;
        PRINT '✓ DailyDelivery cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Delivery Mappings
    IF OBJECT_ID('DeliveryMapping', 'U') IS NOT NULL
    BEGIN
        DELETE FROM DeliveryMapping;
        PRINT '✓ DeliveryMapping cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Vehicle Assignments
    IF OBJECT_ID('VehicleAssignments', 'U') IS NOT NULL
    BEGIN
        DELETE FROM VehicleAssignments;
        PRINT '✓ VehicleAssignments cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Purchase Entries and Purchases
    IF OBJECT_ID('PurchaseEntry', 'U') IS NOT NULL
    BEGIN
        DELETE FROM PurchaseEntry;
        PRINT '✓ PurchaseEntry cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('Purchase', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Purchase;
        PRINT '✓ Purchase cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Expenses
    IF OBJECT_ID('Expenses', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Expenses;
        PRINT '✓ Expenses cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Stock Transactions
    IF OBJECT_ID('StockTransactions', 'U') IS NOT NULL
    BEGIN
        DELETE FROM StockTransactions;
        PRINT '✓ StockTransactions cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Customer Credit data
    IF OBJECT_ID('CreditTransactions', 'U') IS NOT NULL
    BEGIN
        DELETE FROM CreditTransactions;
        PRINT '✓ CreditTransactions cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('CreditPayments', 'U') IS NOT NULL
    BEGIN
        DELETE FROM CreditPayments;
        PRINT '✓ CreditPayments cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('CustomerCredit', 'U') IS NOT NULL
    BEGIN
        DELETE FROM CustomerCredit;
        PRINT '✓ CustomerCredit cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    PRINT '';

    -- ============================================================================
    -- 2. DELETE MASTER DATA (Customers, Vendors, Drivers, Vehicles)
    -- ============================================================================
    PRINT 'Step 2: Cleaning master data...';

    -- Delete invoice-related items that reference Customers first
    IF OBJECT_ID('DeliveryItems', 'U') IS NOT NULL
    BEGIN
        DELETE FROM DeliveryItems;
        PRINT '✓ DeliveryItems cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('InvoiceItems', 'U') IS NOT NULL
    BEGIN
        DELETE FROM InvoiceItems;
        PRINT '✓ InvoiceItems cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Payments before Invoices
    IF OBJECT_ID('Payments', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Payments;
        PRINT '✓ Payments cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('Invoices', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Invoices;
        PRINT '✓ Invoices cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Customers
    IF OBJECT_ID('Customers', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Customers;
        PRINT '✓ Customers cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('Customers1', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Customers1;
        PRINT '✓ Customers1 cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete PurchaseEntries before Vendors
    IF OBJECT_ID('PurchaseEntries', 'U') IS NOT NULL
    BEGIN
        DELETE FROM PurchaseEntries;
        PRINT '✓ PurchaseEntries cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Vendors
    IF OBJECT_ID('Vendors', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Vendors;
        PRINT '✓ Vendors cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Drivers
    IF OBJECT_ID('Drivers', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Drivers;
        PRINT '✓ Drivers cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Vehicles and related data
    IF OBJECT_ID('VehicleSQC', 'U') IS NOT NULL
    BEGIN
        DELETE FROM VehicleSQC;
        PRINT '✓ VehicleSQC cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('Vehicles', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Vehicles;
        PRINT '✓ Vehicles cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete ProductPricing and StockRegister before Products
    IF OBJECT_ID('ProductPricing', 'U') IS NOT NULL
    BEGIN
        DELETE FROM ProductPricing;
        PRINT '✓ ProductPricing cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    IF OBJECT_ID('StockRegister', 'U') IS NOT NULL
    BEGIN
        DELETE FROM StockRegister;
        PRINT '✓ StockRegister cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    -- Delete Products
    IF OBJECT_ID('Products', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Products;
        PRINT '✓ Products cleaned: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' records';
    END

    PRINT '';

    -- ============================================================================
    -- 3. CLEANUP COMPLETE
    -- ============================================================================
    PRINT 'Step 3: All transactional and master data cleaned';
    PRINT '';

    -- ============================================================================
    -- 4. VERIFY CLEANUP
    -- ============================================================================
    PRINT 'Step 4: Verifying cleanup...';
    PRINT '';
    PRINT 'Remaining Data:';
    PRINT '---------------';

    DECLARE @UserCount INT, @RoleCount INT, @PermissionCount INT;
    DECLARE @CustomerCount INT, @VendorCount INT, @DeliveryCount INT;

    SELECT @UserCount = COUNT(*) FROM Users WHERE IsDeleted = 0;
    SELECT @RoleCount = COUNT(*) FROM Roles;
    
    IF OBJECT_ID('RolePermissions', 'U') IS NOT NULL
        SELECT @PermissionCount = COUNT(*) FROM RolePermissions;
    ELSE
        SET @PermissionCount = 0;

    SELECT @CustomerCount = ISNULL((SELECT COUNT(*) FROM Customers), 0);
    SELECT @VendorCount = ISNULL((SELECT COUNT(*) FROM Vendors), 0);
    SELECT @DeliveryCount = ISNULL((SELECT COUNT(*) FROM DailyDelivery), 0);

    PRINT 'Users: ' + CAST(@UserCount AS VARCHAR(10)) + ' (KEPT)';
    PRINT 'Roles: ' + CAST(@RoleCount AS VARCHAR(10)) + ' (KEPT)';
    PRINT 'Permissions: ' + CAST(@PermissionCount AS VARCHAR(10)) + ' (KEPT)';
    PRINT '';
    PRINT 'Customers: ' + CAST(@CustomerCount AS VARCHAR(10)) + ' (should be 0)';
    PRINT 'Vendors: ' + CAST(@VendorCount AS VARCHAR(10)) + ' (should be 0)';
    PRINT 'Deliveries: ' + CAST(@DeliveryCount AS VARCHAR(10)) + ' (should be 0)';

    PRINT '';

    -- ============================================================================
    -- COMMIT TRANSACTION
    -- ============================================================================
    COMMIT TRANSACTION CleanupTransaction;
    
    PRINT '========================================';
    PRINT '✓✓✓ CLEANUP COMPLETED SUCCESSFULLY ✓✓✓';
    PRINT '========================================';
    PRINT '';
    PRINT 'Database is ready for production use!';
    PRINT 'All users, roles, and permissions preserved.';

END TRY
BEGIN CATCH
    -- ============================================================================
    -- ROLLBACK ON ERROR
    -- ============================================================================
    ROLLBACK TRANSACTION CleanupTransaction;
    
    PRINT '';
    PRINT '========================================';
    PRINT '✗✗✗ CLEANUP FAILED - ROLLED BACK ✗✗✗';
    PRINT '========================================';
    PRINT 'Error: ' + ERROR_MESSAGE();
    PRINT 'Line: ' + CAST(ERROR_LINE() AS VARCHAR(10));
    PRINT '';
    PRINT 'Database unchanged.';
    
END CATCH;

GO
