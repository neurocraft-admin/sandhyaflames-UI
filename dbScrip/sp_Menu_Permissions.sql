-- =============================================
-- STORED PROCEDURES FOR MENU AND PERMISSIONS
-- Date: 2025-12-26
-- Purpose: API backend support for menu and permission operations
-- =============================================

USE [sandhyaflames]
GO

-- =============================================
-- SP 1: Get Menu for Current User by RoleId
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetMenuByRole]
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get all menu items the role has access to, ordered by hierarchy
    WITH MenuHierarchy AS (
        -- Get top-level menus (parent = NULL)
        SELECT 
            m.MenuId,
            m.Name,
            m.DisplayName,
            m.Url,
            m.Icon,
            m.ParentMenuId,
            m.ResourceId,
            m.SortOrder,
            0 AS Level,
            CAST(m.SortOrder AS VARCHAR(MAX)) AS SortPath
        FROM MenuItems m
        INNER JOIN MenuAccess ma ON m.MenuId = ma.MenuId
        WHERE ma.RoleId = @RoleId
        AND m.IsActive = 1
        AND m.ParentMenuId IS NULL
        
        UNION ALL
        
        -- Get child menus recursively
        SELECT 
            m.MenuId,
            m.Name,
            m.DisplayName,
            m.Url,
            m.Icon,
            m.ParentMenuId,
            m.ResourceId,
            m.SortOrder,
            mh.Level + 1,
            mh.SortPath + '-' + CAST(m.SortOrder AS VARCHAR(MAX))
        FROM MenuItems m
        INNER JOIN MenuAccess ma ON m.MenuId = ma.MenuId
        INNER JOIN MenuHierarchy mh ON m.ParentMenuId = mh.MenuId
        WHERE ma.RoleId = @RoleId
        AND m.IsActive = 1
    )
    SELECT 
        MenuId AS MenuItemId,          -- Alias to match API expectations
        DisplayName AS Title,          -- API expects "Title"
        Url,
        Icon AS IconName,              -- API might expect "IconName"
        ParentMenuId,
        SortOrder AS DisplayOrder      -- API might expect "DisplayOrder"
    FROM MenuHierarchy
    ORDER BY SortPath;
END
GO

PRINT '✅ Created sp_GetMenuByRole';
GO

-- =============================================
-- SP 2: Get Permissions for Current User by UserId
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetPermissionsByUserId]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get user's role
    DECLARE @RoleId INT;
    DECLARE @Username NVARCHAR(100);
    DECLARE @RoleName NVARCHAR(100);
    
    -- Use dynamic SQL to handle different column names
    DECLARE @sql NVARCHAR(MAX);
    DECLARE @UsernameColumn NVARCHAR(100);
    
    -- Check which column exists in Users table
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Username')
        SET @UsernameColumn = 'Username';
    ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Email')
        SET @UsernameColumn = 'Email';
    ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'FullName')
        SET @UsernameColumn = 'FullName';
    ELSE
        SET @UsernameColumn = 'CAST(UserId AS NVARCHAR(100))';
    
    SET @sql = N'
        SELECT 
            @RoleIdOUT = RoleId,
            @UsernameOUT = ' + @UsernameColumn + '
        FROM Users
        WHERE UserId = @UserIdIN AND IsActive = 1';
    
    EXEC sp_executesql @sql, 
        N'@UserIdIN INT, @RoleIdOUT INT OUTPUT, @UsernameOUT NVARCHAR(100) OUTPUT',
        @UserIdIN = @UserId,
        @RoleIdOUT = @RoleId OUTPUT,
        @UsernameOUT = @Username OUTPUT;
    
    IF @RoleId IS NULL
    BEGIN
        SELECT 0 AS success, 'User not found or inactive' AS message;
        RETURN;
    END
    
    SELECT @RoleName = RoleName FROM Roles WHERE RoleId = @RoleId;
    
    -- Return user info and permissions
    SELECT 
        @UserId AS userId,
        @Username AS username,
        @RoleId AS roleId,
        @RoleName AS roleName;
    
    SELECT 
        r.ResourceId AS resourceId,
        r.ResourceName AS resourceName,
        p.CanView AS canView,
        p.CanCreate AS canCreate,
        p.CanUpdate AS canUpdate,
        p.CanDelete AS canDelete
    FROM Permissions p
    INNER JOIN Resources r ON p.ResourceId = r.ResourceId
    WHERE p.RoleId = @RoleId
    AND r.IsActive = 1;
END
GO

PRINT '✅ Created sp_GetPermissionsByUserId';
GO

-- =============================================
-- SP 3: Check Single Permission
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_CheckPermission]
    @UserId INT,
    @ResourceName NVARCHAR(100),
    @Action NVARCHAR(20)               -- 'View', 'Create', 'Update', 'Delete'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @RoleId INT;
    DECLARE @ResourceId INT;
    DECLARE @Allowed BIT = 0;
    
    -- Get user's role
    SELECT @RoleId = RoleId FROM Users WHERE UserId = @UserId AND IsActive = 1;
    
    -- Get resource ID
    SELECT @ResourceId = ResourceId FROM Resources WHERE ResourceName = @ResourceName AND IsActive = 1;
    
    IF @RoleId IS NULL OR @ResourceId IS NULL
    BEGIN
        SELECT 0 AS allowed, 'User or resource not found' AS message;
        RETURN;
    END
    
    -- Check specific permission
    SELECT @Allowed = 
        CASE @Action
            WHEN 'View' THEN CanView
            WHEN 'Create' THEN CanCreate
            WHEN 'Update' THEN CanUpdate
            WHEN 'Delete' THEN CanDelete
            WHEN 'Export' THEN CanExport
            WHEN 'Approve' THEN CanApprove
            ELSE 0
        END
    FROM Permissions
    WHERE RoleId = @RoleId AND ResourceId = @ResourceId;
    
    SELECT ISNULL(@Allowed, 0) AS allowed;
END
GO

PRINT '✅ Created sp_CheckPermission';
GO

-- =============================================
-- SP 4: Update Permissions for Role
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_UpdateRolePermissions]
    @RoleId INT,
    @ResourceId INT,
    @CanView BIT,
    @CanCreate BIT,
    @CanUpdate BIT,
    @CanDelete BIT,
    @CanExport BIT = 0,
    @CanApprove BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Upsert permission
        MERGE INTO Permissions AS target
        USING (SELECT @RoleId AS RoleId, @ResourceId AS ResourceId) AS source
        ON target.RoleId = source.RoleId AND target.ResourceId = source.ResourceId
        WHEN MATCHED THEN
            UPDATE SET 
                CanView = @CanView,
                CanCreate = @CanCreate,
                CanUpdate = @CanUpdate,
                CanDelete = @CanDelete,
                CanExport = @CanExport,
                CanApprove = @CanApprove,
                UpdatedAt = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (RoleId, ResourceId, CanView, CanCreate, CanUpdate, CanDelete, CanExport, CanApprove)
            VALUES (@RoleId, @ResourceId, @CanView, @CanCreate, @CanUpdate, @CanDelete, @CanExport, @CanApprove);
        
        SELECT 1 AS success, 'Permissions updated successfully' AS message;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 0 AS success, ERROR_MESSAGE() AS message;
    END CATCH
END
GO

PRINT '✅ Created sp_UpdateRolePermissions';
GO

-- =============================================
-- SP 5: Get All Roles with Permission Summary
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetRolesWithPermissions]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.RoleId,
        r.RoleName,
        r.Description,
        COUNT(DISTINCT p.ResourceId) AS ResourceCount,
        SUM(CASE WHEN p.CanView = 1 THEN 1 ELSE 0 END) AS ViewCount,
        SUM(CASE WHEN p.CanCreate = 1 THEN 1 ELSE 0 END) AS CreateCount,
        SUM(CASE WHEN p.CanUpdate = 1 THEN 1 ELSE 0 END) AS UpdateCount,
        SUM(CASE WHEN p.CanDelete = 1 THEN 1 ELSE 0 END) AS DeleteCount
    FROM Roles r
    LEFT JOIN Permissions p ON r.RoleId = p.RoleId
    WHERE r.IsActive = 1
    GROUP BY r.RoleId, r.RoleName, r.Description
    ORDER BY r.RoleName;
END
GO

PRINT '✅ Created sp_GetRolesWithPermissions';
GO

PRINT '';
PRINT '========================================';
PRINT 'All Stored Procedures Created!';
PRINT '========================================';
