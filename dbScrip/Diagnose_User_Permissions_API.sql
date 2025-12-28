-- ============================================================================
-- Diagnose User Permissions API Issue
-- ============================================================================
-- The API returns "General" instead of "DailyDelivery"
-- This script checks the data flow from Users → Permissions
-- ============================================================================

USE [sandhyaflames];
GO

DECLARE @UserId INT = 18; -- roletester user

PRINT '============================================================================';
PRINT 'DIAGNOSTIC: User Permissions Data Flow';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- 1. Check User Details
-- ============================================================================
PRINT '1. User Details:';
SELECT 
    UserId,
    Email,
    FullName,
    RoleId,
    IsActive
FROM Users
WHERE UserId = @UserId;

PRINT '';

-- ============================================================================
-- 2. Check User's Role
-- ============================================================================
PRINT '2. User Role:';
SELECT 
    u.UserId,
    u.Email,
    r.RoleId,
    r.RoleName,
    r.IsActive AS RoleIsActive
FROM Users u
JOIN Roles r ON u.RoleId = r.RoleId
WHERE u.UserId = @UserId;

PRINT '';

-- ============================================================================
-- 3. Check RolePermissions for this Role
-- ============================================================================
PRINT '3. RolePermissions (Raw Data):';
SELECT 
    rp.RolePermissionId,
    rp.RoleId,
    rp.ResourceId,
    rp.ResourceKey,  -- This is what the API returns!
    rp.PermissionMask,
    r.ResourceName   -- This is what we expect
FROM RolePermissions rp
JOIN Resources r ON rp.ResourceId = r.ResourceId
WHERE rp.RoleId = (SELECT RoleId FROM Users WHERE UserId = @UserId);

PRINT '';

-- ============================================================================
-- 4. Check RolePermissions Table Structure
-- ============================================================================
PRINT '4. RolePermissions Table Columns:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'RolePermissions'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- ============================================================================
-- 5. Check ResourceKey in RolePermissions
-- ============================================================================
PRINT '5. RolePermissions - ResourceKey Issue:';
SELECT 
    rp.RolePermissionId,
    rp.ResourceId,
    rp.ResourceKey AS 'ResourceKey_InRolePermissions (WRONG)',
    r.ResourceName AS 'ResourceName_InResources (CORRECT)'
FROM RolePermissions rp
JOIN Resources r ON rp.ResourceId = r.ResourceId
WHERE rp.RoleId = (SELECT RoleId FROM Users WHERE UserId = @UserId);

PRINT '';

-- ============================================================================
-- 6. Simulate Backend API Query (Expected Query)
-- ============================================================================
PRINT '6. Expected API Query Result:';
SELECT 
    COALESCE(r.ResourceKey, r.ResourceName) AS resourceKey,
    rp.PermissionMask AS permissioCurrent - WRONG)
-- ============================================================================
PRINT '6. Current API Query (Returns WRONG ResourceKey):';
SELECT 
    rp.ResourceKey AS resourceKey,  -- Returns 'General' ❌
    rp.PermissionMask AS permissionMask
FROM Users u
JOIN Roles ro ON u.RoleId = ro.RoleId
JOIN RolePermissions rp ON ro.RoleId = rp.RoleId
WHERE u.UserId = @UserId
  AND u.IsActive = 1
  AND ro.IsActive = 1;

PRI8. Check Stored Procedure
-- ============================================================================
PRINT '8. Finding User Permissions Stored Procedure:';
SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE,
    CREATED,
    LAST_ALTERED
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_NAME LIKE '%UserPermission%' OR ROUTINE_NAME LIKE '%GetPermission%'
ORDER BY ROUTINE_NAME;

PRINT '';
PRINT '============================================================================';
PRINT 'ROOT CAUSE IDENTIFIED:';
PRINT '❌ RolePermissions.ResourceKey = "General" (WRONG)';
PRINT '✅ Resources.ResourceName = "DailyDelivery" (CORRECT)';
PRINT '';
PRINT 'SOLUTION OPTIONS:';
PRINT '1. UPDATE RolePermissions SET ResourceKey = ResourceName from Resources table';
PRINT '2. OR: Fix backend stored procedure to JOIN Resources and use ResourceName';
PRINT '';
PRINT 'RECOMMENDED: Option 1 (Update ResourceKey to match ResourceName)
    CREATED,
    LAST_ALTERED
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_NAME LIKE '%UserPermission%' OR ROUTINE_NAME LIKE '%GetPermission%'
ORDER BY ROUTINE_NAME;

PRINT '';
PRINT '============================================================================';
PRINT 'NEXT STEPS:';
PRINT '1. Check if Resources table has ResourceKey column';
PRINT '2. If ResourceKey exists, check its value for DailyDelivery resource';
PRINT '3. Find and review the stored procedure used by /api/permissions/user/{id}';
PRINT '4. The SP should return ResourceName (or ResourceKey) = "DailyDelivery"';
PRINT '============================================================================';
