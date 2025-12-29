-- =============================================
-- MENU AND PERMISSIONS DATABASE SCHEMA
-- Date: 2025-12-26
-- Purpose: Role-based menu and granular permissions system
-- =============================================

USE [sandhyaflames]
GO

-- =============================================
-- TABLE 1: Resources (Pages/Features)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Resources]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Resources] (
        ResourceId INT IDENTITY(1,1) PRIMARY KEY,
        ResourceName NVARCHAR(100) NOT NULL UNIQUE,
        DisplayName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500),
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL,
        CONSTRAINT UQ_ResourceName UNIQUE (ResourceName)
    );
    
    PRINT '✅ Table Resources created';
END
ELSE
    PRINT '⚠️  Table Resources already exists';
GO

-- =============================================
-- TABLE 2: MenuItems
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MenuItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MenuItems] (
        MenuId INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        DisplayName NVARCHAR(100) NOT NULL,
        Url NVARCHAR(200) NULL,                     -- NULL for parent menus (collapsible sections)
        Icon NVARCHAR(50) NULL,                     -- CoreUI icon name (e.g., 'cil-speedometer')
        ParentMenuId INT NULL,                      -- NULL = top-level, otherwise child menu
        ResourceId INT NULL,                        -- Links to Resources for permission check
        SortOrder INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL,
        CONSTRAINT FK_MenuItems_Parent FOREIGN KEY (ParentMenuId) REFERENCES MenuItems(MenuId),
        CONSTRAINT FK_MenuItems_Resource FOREIGN KEY (ResourceId) REFERENCES Resources(ResourceId)
    );
    
    CREATE INDEX IX_MenuItems_Parent ON MenuItems(ParentMenuId);
    CREATE INDEX IX_MenuItems_SortOrder ON MenuItems(SortOrder);
    
    PRINT '✅ Table MenuItems created';
END
ELSE
    PRINT '⚠️  Table MenuItems already exists';
GO

-- =============================================
-- TABLE 3: Permissions (CRUD permissions per role per resource)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Permissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Permissions] (
        PermissionId INT IDENTITY(1,1) PRIMARY KEY,
        RoleId INT NOT NULL,
        ResourceId INT NOT NULL,
        CanView BIT NOT NULL DEFAULT 0,
        CanCreate BIT NOT NULL DEFAULT 0,
        CanUpdate BIT NOT NULL DEFAULT 0,
        CanDelete BIT NOT NULL DEFAULT 0,
        CanExport BIT NOT NULL DEFAULT 0,
        CanApprove BIT NOT NULL DEFAULT 0,          -- Future: For approval workflows
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL,
        CONSTRAINT FK_Permissions_Role FOREIGN KEY (RoleId) REFERENCES Roles(RoleId),
        CONSTRAINT FK_Permissions_Resource FOREIGN KEY (ResourceId) REFERENCES Resources(ResourceId),
        CONSTRAINT UQ_RoleResource UNIQUE (RoleId, ResourceId)
    );
    
    CREATE INDEX IX_Permissions_Role ON Permissions(RoleId);
    CREATE INDEX IX_Permissions_Resource ON Permissions(ResourceId);
    
    PRINT '✅ Table Permissions created';
END
ELSE
    PRINT '⚠️  Table Permissions already exists';
GO

-- =============================================
-- TABLE 4: MenuAccess (Which roles can see which menus)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MenuAccess]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MenuAccess] (
        MenuAccessId INT IDENTITY(1,1) PRIMARY KEY,
        MenuId INT NOT NULL,
        RoleId INT NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_MenuAccess_Menu FOREIGN KEY (MenuId) REFERENCES MenuItems(MenuId),
        CONSTRAINT FK_MenuAccess_Role FOREIGN KEY (RoleId) REFERENCES Roles(RoleId),
        CONSTRAINT UQ_MenuRole UNIQUE (MenuId, RoleId)
    );
    
    CREATE INDEX IX_MenuAccess_Role ON MenuAccess(RoleId);
    
    PRINT '✅ Table MenuAccess created';
END
ELSE
    PRINT '⚠️  Table MenuAccess already exists';
GO

PRINT '';
PRINT '========================================';
PRINT 'Schema Created Successfully!';
PRINT '========================================';
