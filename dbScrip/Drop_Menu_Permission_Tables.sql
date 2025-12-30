-- =============================================
-- DROP MENU AND PERMISSION TABLES
-- Date: 2025-12-27
-- Purpose: Clean up existing tables to recreate with correct schema
-- =============================================

USE [sandhyaflames]
GO

PRINT '🗑️  Dropping existing menu/permission tables...';
PRINT '';

-- Find and drop all foreign keys referencing Resources table
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql += 'ALTER TABLE [' + OBJECT_SCHEMA_NAME(parent_object_id) + '].[' + OBJECT_NAME(parent_object_id) + 
               '] DROP CONSTRAINT [' + name + '];' + CHAR(13)
FROM sys.foreign_keys
WHERE referenced_object_id = OBJECT_ID('dbo.Resources');

IF @sql <> ''
BEGIN
    EXEC sp_executesql @sql;
    PRINT '✅ Dropped all foreign keys referencing Resources table';
END

-- Drop foreign key constraints first
IF OBJECT_ID('dbo.MenuItems', 'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MenuItems_Resource')
        ALTER TABLE dbo.MenuItems DROP CONSTRAINT FK_MenuItems_Resource;
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MenuItems_Parent')
        ALTER TABLE dbo.MenuItems DROP CONSTRAINT FK_MenuItems_Parent;
    PRINT '✅ Dropped MenuItems constraints';
END

IF OBJECT_ID('dbo.Permissions', 'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Permissions_Resource')
        ALTER TABLE dbo.Permissions DROP CONSTRAINT FK_Permissions_Resource;
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Permissions_Role')
        ALTER TABLE dbo.Permissions DROP CONSTRAINT FK_Permissions_Role;
    PRINT '✅ Dropped Permissions constraints';
END

IF OBJECT_ID('dbo.MenuAccess', 'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MenuAccess_Menu')
        ALTER TABLE dbo.MenuAccess DROP CONSTRAINT FK_MenuAccess_Menu;
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MenuAccess_Role')
        ALTER TABLE dbo.MenuAccess DROP CONSTRAINT FK_MenuAccess_Role;
    PRINT '✅ Dropped MenuAccess constraints';
END

-- Now drop tables in reverse order of dependencies
IF OBJECT_ID('dbo.MenuAccess', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.MenuAccess;
    PRINT '✅ Dropped MenuAccess table';
END

IF OBJECT_ID('dbo.Permissions', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Permissions;
    PRINT '✅ Dropped Permissions table';
END

IF OBJECT_ID('dbo.MenuItems', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.MenuItems;
    PRINT '✅ Dropped MenuItems table';
END

IF OBJECT_ID('dbo.Resources', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Resources;
    PRINT '✅ Dropped Resources table';
END

PRINT '';
PRINT '========================================';
PRINT 'All menu/permission tables dropped!';
PRINT 'Now run Menu_Permissions_Schema.sql';
PRINT '========================================';
