-- ============================================================================
-- Fix Role Permissions System - Complete Fix
-- ============================================================================
-- FIXES:
-- 1. sp_UpdateRolePermissions - Save to RolePermissions table with PermissionMask
-- 2. Auto-create MenuAccess entries (child + parent menus)
-- 3. sp_GetRolePermissions - Read from RolePermissions table
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Fixing Role Permissions System';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- FIX 1: Update sp_UpdateRolePermissions to use RolePermissions + PermissionMask
-- ============================================================================
PRINT 'Creating sp_UpdateRolePermissions (Fixed)...';
GO

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
        
        -- Calculate PermissionMask from individual permissions
        DECLARE @PermissionMask INT = 0;
        IF @CanView = 1 SET @PermissionMask = @PermissionMask | 1;      -- View = 1
        IF @CanCreate = 1 SET @PermissionMask = @PermissionMask | 2;    -- Create = 2
        IF @CanUpdate = 1 SET @PermissionMask = @PermissionMask | 4;    -- Update = 4
        IF @CanDelete = 1 SET @PermissionMask = @PermissionMask | 8;    -- Delete = 8
        IF @CanExport = 1 SET @PermissionMask = @PermissionMask | 16;   -- Export = 16
        IF @CanApprove = 1 SET @PermissionMask = @PermissionMask | 32;  -- Approve = 32
        
        -- Get ResourceKey from Resources table
        DECLARE @ResourceKey NVARCHAR(100);
        SELECT @ResourceKey = ResourceName FROM Resources WHERE ResourceId = @ResourceId;
        
        -- Upsert into RolePermissions table (not Permissions)
        MERGE INTO RolePermissions AS target
        USING (SELECT @RoleId AS RoleId, @ResourceId AS ResourceId) AS source
        ON target.RoleId = source.RoleId AND target.ResourceId = source.ResourceId
        WHEN MATCHED THEN
            UPDATE SET 
                PermissionMask = @PermissionMask,
                ResourceKey = @ResourceKey
        WHEN NOT MATCHED THEN
            INSERT (RoleId, ResourceId, ResourceKey, PermissionMask)
            VALUES (@RoleId, @ResourceId, @ResourceKey, @PermissionMask);
        
        -- Auto-create MenuAccess entries if permission granted and menu exists
        IF @PermissionMask > 0
        BEGIN
            -- Grant access to the child menu (the actual menu item)
            INSERT INTO MenuAccess (RoleId, MenuId)
            SELECT DISTINCT @RoleId, mi.MenuId
            FROM Resources r
            JOIN MenuItems mi ON r.ResourceId = mi.ResourceId
            WHERE r.ResourceId = @ResourceId
              AND NOT EXISTS (
                  SELECT 1 FROM MenuAccess 
                  WHERE RoleId = @RoleId AND MenuId = mi.MenuId
              );
            
            -- Also grant access to parent menu (if child is submenu)
            INSERT INTO MenuAccess (RoleId, MenuId)
            SELECT DISTINCT @RoleId, parent.MenuId
            FROM Resources r
            JOIN MenuItems mi ON r.ResourceId = mi.ResourceId
            JOIN MenuItems parent ON mi.ParentMenuId = parent.MenuId
            WHERE r.ResourceId = @ResourceId
              AND mi.ParentMenuId IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM MenuAccess 
                  WHERE RoleId = @RoleId AND MenuId = parent.MenuId
              );
        END
        ELSE
        BEGIN
            -- If all permissions removed, remove MenuAccess
            DELETE FROM MenuAccess
            WHERE RoleId = @RoleId
              AND MenuId IN (
                  SELECT mi.MenuId
                  FROM Resources r
                  JOIN MenuItems mi ON r.ResourceId = mi.ResourceId
                  WHERE r.ResourceId = @ResourceId
              );
        END
        
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

PRINT '✅ Fixed sp_UpdateRolePermissions';
PRINT '';

-- ============================================================================
-- FIX 2: Update sp_GetRolePermissions to read from RolePermissions table
-- ============================================================================
PRINT 'Creating sp_GetRolePermissions (Fixed)...';
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_GetRolePermissions]
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Return all resources with their permissions for this role
    SELECT 
        r.ResourceId,
        r.ResourceName,
        r.DisplayName,
        CAST(CASE WHEN rp.PermissionMask IS NULL THEN 0 
             ELSE CASE WHEN (rp.PermissionMask & 1) = 1 THEN 1 ELSE 0 END 
        END AS BIT) AS CanView,
        CAST(CASE WHEN rp.PermissionMask IS NULL THEN 0 
             ELSE CASE WHEN (rp.PermissionMask & 2) = 2 THEN 1 ELSE 0 END 
        END AS BIT) AS CanCreate,
        CAST(CASE WHEN rp.PermissionMask IS NULL THEN 0 
             ELSE CASE WHEN (rp.PermissionMask & 4) = 4 THEN 1 ELSE 0 END 
        END AS BIT) AS CanUpdate,
        CAST(CASE WHEN rp.PermissionMask IS NULL THEN 0 
             ELSE CASE WHEN (rp.PermissionMask & 8) = 8 THEN 1 ELSE 0 END 
        END AS BIT) AS CanDelete,
        CAST(CASE WHEN rp.PermissionMask IS NULL THEN 0 
             ELSE CASE WHEN (rp.PermissionMask & 16) = 16 THEN 1 ELSE 0 END 
        END AS BIT) AS CanExport,
        CAST(CASE WHEN rp.PermissionMask IS NULL THEN 0 
             ELSE CASE WHEN (rp.PermissionMask & 32) = 32 THEN 1 ELSE 0 END 
        END AS BIT) AS CanApprove
    FROM Resources r
    LEFT JOIN RolePermissions rp ON r.ResourceId = rp.ResourceId AND rp.RoleId = @RoleId
    WHERE r.IsActive = 1
    ORDER BY r.DisplayName;
END
GO

PRINT '✅ Fixed sp_GetRolePermissions';
PRINT '';

-- ============================================================================
-- FIX 3: Ensure Dashboard MenuAccess for all roles
-- ============================================================================
PRINT 'Ensuring all active roles have Dashboard access...';

INSERT INTO MenuAccess (RoleId, MenuId)
SELECT DISTINCT r.RoleId, 1  -- MenuId 1 = Dashboard
FROM Roles r
WHERE r.IsActive = 1
  AND NOT EXISTS (
      SELECT 1 FROM MenuAccess 
      WHERE RoleId = r.RoleId AND MenuId = 1
  );

DECLARE @DashboardRowsAdded INT = @@ROWCOUNT;
PRINT '✅ Granted Dashboard access to ' + CAST(@DashboardRowsAdded AS NVARCHAR(10)) + ' role(s)';

PRINT '';
PRINT '============================================================================';
PRINT '✅ Role Permissions System Fixed!';
PRINT '';
PRINT 'What is fixed:';
PRINT '  ✅ Role Permissions UI save now works';
PRINT '  ✅ Permissions saved to RolePermissions table with PermissionMask';
PRINT '  ✅ MenuAccess entries auto-created when permissions granted';
PRINT '  ✅ Parent menus auto-granted when child menu has permission';
PRINT '  ✅ sp_GetRolePermissions returns DisplayName for better UI';
PRINT '';
PRINT 'Test Steps:';
PRINT '  1. Go to Role Permissions page';
PRINT '  2. Select RoleTester role';
PRINT '  3. Check some permissions (e.g., Delivery > Daily Delivery)';
PRINT '  4. Click Save Permissions';
PRINT '  5. Logout and login as roletester@sandhyaflames.in';
PRINT '  6. Verify menu items appear and buttons show based on permissions';
PRINT '============================================================================';
