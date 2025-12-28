-- ============================================================================
-- Diagnose User Role Update Issue
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Diagnosing User Role Update Foreign Key Error';
PRINT '============================================================================';
PRINT '';

-- 1. Check all roles
PRINT '1. All Roles:';
SELECT RoleId, RoleName, IsActive
FROM Roles
ORDER BY RoleId;

PRINT '';

-- 2. Check FK constraints on Users table
PRINT '2. Foreign Key Constraints on Users table:';
SELECT 
    fk.name AS FK_Name,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fc 
    ON fk.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) = 'Users';

PRINT '';

-- 3. Check if UserRoles table exists
PRINT '3. Check for UserRoles table:';
IF OBJECT_ID('dbo.UserRoles', 'U') IS NOT NULL
BEGIN
    PRINT '   ✅ UserRoles table exists';
    SELECT TOP 10 * FROM UserRoles;
END
ELSE
BEGIN
    PRINT '   ❌ UserRoles table does NOT exist';
END

PRINT '';

-- 4. Check Users table structure
PRINT '4. Users Table Structure:';
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length,
    c.is_nullable
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('Users')
ORDER BY c.column_id;

PRINT '';

-- 5. Sample users data
PRINT '5. Sample Users (first 5):';
SELECT TOP 5 UserId, Email, RoleId, IsActive
FROM Users
ORDER BY UserId;

PRINT '';
PRINT '============================================================================';
