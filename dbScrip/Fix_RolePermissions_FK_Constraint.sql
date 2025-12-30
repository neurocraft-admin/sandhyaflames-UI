-- ============================================================================
-- Fix RolePermissions Foreign Key - Point to Roles instead of UserRoles
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Fixing RolePermissions.RoleId Foreign Key Constraint';
PRINT '============================================================================';
PRINT '';

-- 1. Check current FK constraints
PRINT 'Current FK constraints on RolePermissions table:';
SELECT 
    fk.name AS FK_Name,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fc 
    ON fk.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) = 'RolePermissions';

PRINT '';

-- 2. Drop FK pointing to UserRoles
PRINT 'Dropping FK constraint pointing to UserRoles...';
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__RolePermi__RoleI__28ED12D1')
BEGIN
    ALTER TABLE RolePermissions DROP CONSTRAINT FK__RolePermi__RoleI__28ED12D1;
    PRINT '✅ Dropped FK constraint FK__RolePermi__RoleI__28ED12D1';
END
ELSE
    PRINT '⚠️  FK constraint not found';

PRINT '';

-- 3. Create new FK pointing to Roles
PRINT 'Creating new FK constraint pointing to Roles table...';
ALTER TABLE RolePermissions
ADD CONSTRAINT FK_RolePermissions_Roles
FOREIGN KEY (RoleId) REFERENCES Roles(RoleId);

PRINT '✅ Created FK constraint FK_RolePermissions_Roles → Roles table';

PRINT '';

-- 4. Verify
PRINT 'Verifying FK constraints on RolePermissions table:';
SELECT 
    fk.name AS FK_Name,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fc 
    ON fk.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) = 'RolePermissions';

PRINT '';
PRINT '============================================================================';
PRINT '✅ RolePermissions table now correctly references Roles table!';
PRINT '';
PRINT 'Now you can:';
PRINT '  1. Use Role Permissions UI to grant permissions';
PRINT '  2. Permissions will save to any role in Roles table';
PRINT '  3. Including: Biller, RoleTester, Administrator, etc.';
PRINT '============================================================================';
