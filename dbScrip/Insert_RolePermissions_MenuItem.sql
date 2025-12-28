-- =============================================
-- Add "Role Permissions" Menu Item to Database
-- Date: 2025-12-27
-- =============================================

USE [sandhyaflames]
GO

-- First, find the ResourceId for 'Roles' resource
DECLARE @RolesResourceId INT;
SELECT @RolesResourceId = ResourceId FROM Resources WHERE ResourceName = 'Roles';

-- Find the Admin section parent menu (if exists)
DECLARE @AdminParentId INT;
SELECT @AdminParentId = MenuId FROM MenuItems WHERE Name = 'Admin' AND Url IS NULL;

-- Get the new menu item ID
DECLARE @NewMenuId INT;

-- Insert the Role Permissions menu item
-- Check if it already exists
IF NOT EXISTS (SELECT 1 FROM MenuItems WHERE Url = '/role-permissions')
BEGIN
    INSERT INTO MenuItems (Name, DisplayName, Url, Icon, ParentMenuId, SortOrder, IsActive, ResourceId)
    VALUES (
        'RolePermissions',           -- Name (internal identifier)
        'Role Permissions',          -- DisplayName (shown in menu)
        '/role-permissions',         -- Url
        'cil-lock-locked',          -- Icon
        @AdminParentId,             -- ParentMenuId (Admin section)
        2,                          -- SortOrder (after Roles = 1)
        1,                          -- IsActive
        @RolesResourceId           -- ResourceId (link to Roles resource)
    );
    
    SET @NewMenuId = SCOPE_IDENTITY();
    
    PRINT '✅ Role Permissions menu item added successfully';
    PRINT 'MenuId: ' + CAST(@NewMenuId AS NVARCHAR(10));
    
    -- Grant access to all roles
    INSERT INTO MenuAccess (MenuId, RoleId)
    SELECT @NewMenuId, RoleId 
    FROM Roles 
    WHERE IsActive = 1;
    
    PRINT '✅ MenuAccess entries created for all active roles';
END
ELSE
BEGIN
    PRINT '⚠️ Role Permissions menu item already exists';
    
    -- Still add MenuAccess if missing
    SELECT @NewMenuId = MenuId FROM MenuItems WHERE Url = '/role-permissions';
    
    INSERT INTO MenuAccess (MenuId, RoleId)
    SELECT @NewMenuId, r.RoleId 
    FROM Roles r
    WHERE r.IsActive = 1
    AND NOT EXISTS (
        SELECT 1 FROM MenuAccess ma 
        WHERE ma.MenuId = @NewMenuId AND ma.RoleId = r.RoleId
    );
    
    PRINT '✅ Missing MenuAccess entries added';
END
GO

-- Verify the insertion
SELECT 
    MenuId,
    Name,
    DisplayName,
    Url,
    Icon,
    ParentMenuId,
    SortOrder,
    ResourceId
FROM MenuItems
WHERE Url = '/role-permissions';
GO
