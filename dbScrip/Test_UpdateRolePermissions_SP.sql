-- ============================================================================
-- Test sp_UpdateRolePermissions Directly
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Testing sp_UpdateRolePermissions Stored Procedure';
PRINT '============================================================================';
PRINT '';

-- Test parameters (simulating what the API sends)
DECLARE @TestRoleId INT = 7;  -- Biller role
DECLARE @TestResourceId INT = 4;  -- DailyDelivery (ResourceId=4)
DECLARE @TestCanView BIT = 1;
DECLARE @TestCanCreate BIT = 0;
DECLARE @TestCanUpdate BIT = 0;
DECLARE @TestCanDelete BIT = 0;

PRINT 'Test Parameters:';
PRINT '  RoleId: ' + CAST(@TestRoleId AS NVARCHAR(10)) + ' (Biller)';
PRINT '  ResourceId: ' + CAST(@TestResourceId AS NVARCHAR(10)) + ' (DailyDelivery)';
PRINT '  CanView: ' + CAST(@TestCanView AS NVARCHAR(10));
PRINT '  CanCreate: ' + CAST(@TestCanCreate AS NVARCHAR(10));
PRINT '  CanUpdate: ' + CAST(@TestCanUpdate AS NVARCHAR(10));
PRINT '  CanDelete: ' + CAST(@TestCanDelete AS NVARCHAR(10));
PRINT '';

-- Check BEFORE state
PRINT 'BEFORE - RolePermissions for Biller (RoleId=7):';
SELECT RolePermissionId, RoleId, ResourceId, ResourceKey, PermissionMask
FROM RolePermissions
WHERE RoleId = @TestRoleId;

PRINT '';

PRINT 'BEFORE - MenuAccess for Biller (RoleId=7):';
SELECT MenuAccessId, RoleId, MenuId
FROM MenuAccess
WHERE RoleId = @TestRoleId;

PRINT '';

-- Execute the stored procedure
PRINT 'Executing sp_UpdateRolePermissions...';
EXEC sp_UpdateRolePermissions 
    @RoleId = @TestRoleId,
    @ResourceId = @TestResourceId,
    @CanView = @TestCanView,
    @CanCreate = @TestCanCreate,
    @CanUpdate = @TestCanUpdate,
    @CanDelete = @TestCanDelete;

PRINT '';

-- Check AFTER state
PRINT 'AFTER - RolePermissions for Biller (RoleId=7):';
SELECT RolePermissionId, RoleId, ResourceId, ResourceKey, PermissionMask
FROM RolePermissions
WHERE RoleId = @TestRoleId;

PRINT '';

PRINT 'AFTER - MenuAccess for Biller (RoleId=7):';
SELECT MenuAccessId, RoleId, MenuId, 
       (SELECT DisplayName FROM MenuItems WHERE MenuId = MenuAccess.MenuId) AS MenuName
FROM MenuAccess
WHERE RoleId = @TestRoleId;

PRINT '';

-- Check if DailyDelivery resource has a linked MenuId
PRINT 'DailyDelivery Resource-Menu Linkage:';
SELECT 
    r.ResourceId,
    r.ResourceName,
    r.DisplayName,
    mi.MenuId,
    mi.DisplayName AS MenuDisplayName,
    mi.ParentMenuId
FROM Resources r
LEFT JOIN MenuItems mi ON r.ResourceId = mi.ResourceId
WHERE r.ResourceId = @TestResourceId;

PRINT '';
PRINT '============================================================================';
PRINT 'Analysis:';
PRINT '  - If RolePermissions has new row → SP INSERT worked ✅';
PRINT '  - If PermissionMask = 1 → Bitmask calculation correct ✅';
PRINT '  - If MenuAccess has new rows → Auto-menu creation worked ✅';
PRINT '  - If MenuItems.ResourceId is NULL → Menu not linked to resource ❌';
PRINT '============================================================================';
