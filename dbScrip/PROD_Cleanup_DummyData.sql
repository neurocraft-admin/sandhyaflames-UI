-- ============================================================================
-- PRODUCTION DATABASE - CLEANUP DUMMY/TEST DATA
-- ============================================================================
-- Purpose: Remove all test/dummy data after migrating from dev to production
-- Keeps: Admin user, Admin role, and essential reference data
-- Run this AFTER restoring dev database backup to production
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '========================================';
PRINT 'Starting Production Data Cleanup...';
PRINT '========================================';
PRINT '';

-- ============================================================================
-- 1. BACKUP TABLES BEFORE CLEANUP (Optional Safety)
-- ============================================================================
PRINT 'Step 1: Creating safety backup of Users table...';

IF OBJECT_ID('Users_PreCleanup_Backup', 'U') IS NOT NULL
    DROP TABLE Users_PreCleanup_Backup;

SELECT * INTO Users_PreCleanup_Backup FROM Users;
PRINT '✓ Users backup created';
PRINT '';

-- ============================================================================
-- 2. IDENTIFY ADMIN USER (Keep this user)
-- ============================================================================
PRINT 'Step 2: Identifying admin user...';

DECLARE @AdminUserId INT;
DECLARE @AdminRoleId INT;

-- Get or create Admin role
SELECT @AdminRoleId = RoleId FROM Roles WHERE RoleName = 'Admin';

IF @AdminRoleId IS NULL
BEGIN
    PRINT '⚠ Admin role not found. Will create in next script.';
END
ELSE
BEGIN
    PRINT '✓ Admin role found: RoleId = ' + CAST(@AdminRoleId AS VARCHAR(10));
END

-- Find existing admin user
SELECT @AdminUserId = UserId FROM Users WHERE Username = 'admin';

IF @AdminUserId IS NOT NULL
BEGIN
    PRINT '✓ Existing admin user found: UserId = ' + CAST(@AdminUserId AS VARCHAR(10));
END
ELSE
BEGIN
    PRINT '⚠ No admin user found. Will create in next script.';
END
PRINT '';

-- ============================================================================
-- 3. CLEAN TRANSACTIONAL DATA (Orders, Deliveries, etc.)
-- ============================================================================
PRINT 'Step 3: Cleaning transactional data...';

BEGIN TRANSACTION CleanupTransaction;

BEGIN TRY

    -- Delete Commercial Deliveries
    IF OBJECT_ID('CommercialDelivery', 'U') IS NOT NULL
    BEGIN
        DELETE FROM CommercialDelivery;
        PRINT '✓ CommercialDelivery table cleaned';
    END

    -- Delete Daily Deliveries
    IF OBJECT_ID('DailyDelivery', 'U') IS NOT NULL
    BEGIN
        DELETE FROM DailyDelivery;
        PRINT '✓ DailyDelivery table cleaned';
    END

    -- Delete Delivery Mappings
    IF OBJECT_ID('DeliveryMapping', 'U') IS NOT NULL
    BEGIN
        DELETE FROM DeliveryMapping;
        PRINT '✓ DeliveryMapping table cleaned';
    END

    -- Delete Customer Deliveries
    IF OBJECT_ID('CustomerDeliveries', 'U') IS NOT NULL
    BEGIN
        DELETE FROM CustomerDeliveries;
        PRINT '✓ CustomerDeliveries table cleaned';
    END

    -- Delete Vehicle Assignments
    IF OBJECT_ID('VehicleAssignments', 'U') IS NOT NULL
    BEGIN
        DELETE FROM VehicleAssignments;
        PRINT '✓ VehicleAssignments table cleaned';
    END

    -- Delete Purchase Entries
    IF OBJECT_ID('PurchaseEntry', 'U') IS NOT NULL
    BEGIN
        DELETE FROM PurchaseEntry;
        PRINT '✓ PurchaseEntry table cleaned';
    END

    -- Delete Purchases
    IF OBJECT_ID('Purchase', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Purchase;
        PRINT '✓ Purchase table cleaned';
    END

    -- Delete Expenses
    IF OBJECT_ID('Expenses', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Expenses;
        PRINT '✓ Expenses table cleaned';
    END

    -- Delete Stock Transactions
    IF OBJECT_ID('StockTransactions', 'U') IS NOT NULL
    BEGIN
        DELETE FROM StockTransactions;
        PRINT '✓ StockTransactions table cleaned';
    END

    -- Delete Customer Credit Transactions
    IF OBJECT_ID('CustomerCreditTransactions', 'U') IS NOT NULL
    BEGIN
        DELETE FROM CustomerCreditTransactions;
        PRINT '✓ CustomerCreditTransactions table cleaned';
    END

    -- Delete Customer Credit Payments
    IF OBJECT_ID('CustomerCreditPayments', 'U') IS NOT NULL
    BEGIN
        DELETE FROM CustomerCreditPayments;
        PRINT '✓ CustomerCreditPayments table cleaned';
    END

    PRINT '';

    -- ============================================================================
    -- 4. CLEAN MASTER DATA (Customers, Vendors, Drivers, Vehicles)
    -- ============================================================================
    PRINT 'Step 4: Cleaning master data (test records)...';

    -- Reset Customer Credits
    IF OBJECT_ID('CustomerCredit', 'U') IS NOT NULL
    BEGIN
        UPDATE CustomerCredit SET CreditLimit = 0, CreditUsed = 0, CreditAvailable = 0;
        PRINT '✓ Customer credits reset to zero';
    END

    -- Delete all Customers (assuming all are test data)
    IF OBJECT_ID('Customers', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Customers;
        PRINT '✓ Customers table cleaned';
    END

    -- Delete all Vendors
    IF OBJECT_ID('Vendors', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Vendors;
        PRINT '✓ Vendors table cleaned';
    END

    -- Delete all Drivers
    IF OBJECT_ID('Drivers', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Drivers;
        PRINT '✓ Drivers table cleaned';
    END

    -- Delete all Vehicles
    IF OBJECT_ID('Vehicles', 'U') IS NOT NULL
    BEGIN
        DELETE FROM Vehicles;
        PRINT '✓ Vehicles table cleaned';
    END

    -- Delete Vehicle SQC records
    IF OBJECT_ID('VehicleSQC', 'U') IS NOT NULL
    BEGIN
        DELETE FROM VehicleSQC;
        PRINT '✓ VehicleSQC table cleaned';
    END

    PRINT '';

    -- ============================================================================
    -- 5. CLEAN USERS (Keep only admin)
    -- ============================================================================
    PRINT 'Step 5: Cleaning user accounts (keeping admin only)...';

    IF OBJECT_ID('Users', 'U') IS NOT NULL
    BEGIN
        DECLARE @DeletedUsers INT;
        
        -- Delete all users except admin
        DELETE FROM Users WHERE Username != 'admin';
        SET @DeletedUsers = @@ROWCOUNT;
        
        PRINT '✓ Deleted ' + CAST(@DeletedUsers AS VARCHAR(10)) + ' test users (kept admin)';
    END

    PRINT '';

    -- ============================================================================
    -- 6. RESET PRODUCT STOCK (Optional - set to zero or keep structure)
    -- ============================================================================
    PRINT 'Step 6: Resetting product stock levels...';

    IF OBJECT_ID('Products', 'U') IS NOT NULL
    BEGIN
        -- Reset stock quantities to zero for fresh start
        UPDATE Products SET 
            EmptyStock = 0,
            FilledStock = 0,
            DamagedStock = 0
        WHERE ProductId IS NOT NULL;
        
        PRINT '✓ Product stock levels reset to zero';
    END

    PRINT '';

    -- ============================================================================
    -- 7. VERIFY CLEANUP
    -- ============================================================================
    PRINT 'Step 7: Verifying cleanup...';
    PRINT '';
    PRINT 'Remaining Records:';
    PRINT '-----------------';

    DECLARE @UserCount INT, @CustomerCount INT, @VendorCount INT, @ProductCount INT, @RoleCount INT;

    SELECT @UserCount = COUNT(*) FROM Users;
    SELECT @CustomerCount = COUNT(*) FROM Customers;
    SELECT @VendorCount = COUNT(*) FROM Vendors;
    SELECT @ProductCount = COUNT(*) FROM Products;
    SELECT @RoleCount = COUNT(*) FROM Roles;

    PRINT 'Users: ' + CAST(@UserCount AS VARCHAR(10)) + ' (should be 1 - admin only)';
    PRINT 'Customers: ' + CAST(@CustomerCount AS VARCHAR(10)) + ' (should be 0)';
    PRINT 'Vendors: ' + CAST(@VendorCount AS VARCHAR(10)) + ' (should be 0)';
    PRINT 'Products: ' + CAST(@ProductCount AS VARCHAR(10)) + ' (structure kept, stock reset)';
    PRINT 'Roles: ' + CAST(@RoleCount AS VARCHAR(10)) + ' (structure kept)';

    PRINT '';

    -- ============================================================================
    -- COMMIT TRANSACTION
    -- ============================================================================
    COMMIT TRANSACTION CleanupTransaction;
    PRINT '========================================';
    PRINT '✓✓✓ CLEANUP COMPLETED SUCCESSFULLY ✓✓✓';
    PRINT '========================================';
    PRINT '';
    PRINT 'Next Step: Run PROD_Setup_Admin.sql to ensure admin user is properly configured';

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
    PRINT 'Error Message: ' + ERROR_MESSAGE();
    PRINT 'Error Line: ' + CAST(ERROR_LINE() AS VARCHAR(10));
    PRINT '';
    PRINT 'Database has been rolled back to state before cleanup.';
    
END CATCH;

GO
