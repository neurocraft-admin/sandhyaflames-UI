-- ============================================================================
-- Fix Users Table Foreign Key - Point to Roles table instead of UserRoles
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Fixing Users.RoleId Foreign Key Constraint';
PRINT '============================================================================';
PRINT '';

-- 1. Drop existing FK constraint
PRINT 'Dropping old FK constraint (pointing to UserRoles)...';
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__Users__RoleId__3D5E1FD2')
BEGIN
    ALTER TABLE Users DROP CONSTRAINT FK__Users__RoleId__3D5E1FD2;
    PRINT '✅ Dropped FK constraint FK__Users__RoleId__3D5E1FD2';
END
ELSE
    PRINT '⚠️  FK constraint not found';

PRINT '';

-- 2. Create new FK constraint pointing to Roles table
PRINT 'Creating new FK constraint (pointing to Roles)...';
ALTER TABLE Users
ADD CONSTRAINT FK_Users_Roles
FOREIGN KEY (RoleId) REFERENCES Roles(RoleId);

PRINT '✅ Created FK constraint FK_Users_Roles → Roles table';

PRINT '';

-- 3. Verify
PRINT 'Verifying FK constraints on Users table:';
SELECT 
    fk.name AS FK_Name,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fc 
    ON fk.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) = 'Users'
  AND COL_NAME(fc.parent_object_id, fc.parent_column_id) = 'RoleId';

PRINT '';
PRINT '============================================================================';
PRINT '✅ Users table now correctly references Roles table!';
PRINT '';
PRINT 'You can now update users with roles from the Roles table:';
PRINT '  - Administrator (RoleId=1)';
PRINT '  - Manager (RoleId=2)';
PRINT '  - Operator (RoleId=3)';
PRINT '  - Viewer (RoleId=4)';
PRINT '  - editor (RoleId=5)';
PRINT '  - RoleTester (RoleId=6)';
PRINT '  - Biller (RoleId=7)';
PRINT '============================================================================';
