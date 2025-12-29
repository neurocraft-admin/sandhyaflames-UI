-- =============================================
-- CREATE ROLES TABLE
-- Date: 2025-12-27
-- Purpose: Create Roles table for menu/permission system
-- =============================================

USE [sandhyaflames]
GO

-- =============================================
-- TABLE: Roles
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Roles] (
        RoleId INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255),
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL
    );
    
    PRINT '✅ Table Roles created';
    
    -- Insert default roles
    SET IDENTITY_INSERT Roles ON;
    
    INSERT INTO Roles (RoleId, RoleName, Description, IsActive)
    VALUES 
        (1, 'Administrator', 'Full system access with all permissions', 1),
        (2, 'Manager', 'Management level access', 1),
        (3, 'Operator', 'Daily operations access', 1),
        (4, 'Viewer', 'Read-only access', 1);
    
    SET IDENTITY_INSERT Roles OFF;
    
    PRINT '✅ Default roles inserted: Administrator, Manager, Operator, Viewer';
END
ELSE
    PRINT '⚠️  Table Roles already exists';
GO

-- =============================================
-- UPDATE USERS TABLE (if it exists)
-- Add RoleId column if not present
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'RoleId')
    BEGIN
        ALTER TABLE Users ADD RoleId INT NULL;
        PRINT '✅ Added RoleId column to Users table';
        
        -- Set default role (Administrator) for existing users
        UPDATE Users SET RoleId = 1 WHERE RoleId IS NULL;
        
        -- Make it NOT NULL after setting defaults
        ALTER TABLE Users ALTER COLUMN RoleId INT NOT NULL;
        
        -- Add foreign key constraint
        ALTER TABLE Users ADD CONSTRAINT FK_Users_Role 
            FOREIGN KEY (RoleId) REFERENCES Roles(RoleId);
        
        PRINT '✅ Added foreign key constraint Users.RoleId -> Roles.RoleId';
    END
    ELSE
        PRINT '⚠️  RoleId column already exists in Users table';
END
ELSE
    PRINT 'ℹ️  Users table not found - will be created separately';
GO

PRINT '';
PRINT '========================================';
PRINT 'Roles Table Setup Complete!';
PRINT '========================================';
