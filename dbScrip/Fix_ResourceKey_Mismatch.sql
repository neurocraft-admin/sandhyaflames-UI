-- ============================================================================
-- Fix ResourceKey Mismatch in RolePermissions Table
-- ============================================================================
-- PROBLEM: RolePermissions.ResourceKey = 'General' (wrong)
-- SOLUTION: Update ResourceKey to match Resources.ResourceName
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Fixing ResourceKey in RolePermissions Table';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- BEFORE: Show current mismatch
-- ============================================================================
PRINT 'BEFORE - Current ResourceKey values:';
SELECT 
    rp.RolePermissionId,
    rp.ResourceId,
    rp.ResourceKey AS 'ResourceKey_Current (WRONG)',
    r.ResourceName AS 'ResourceName_Correct (Should be)'
FROM RolePermissions rp
JOIN Resources r ON rp.ResourceId = r.ResourceId
WHERE rp.ResourceKey <> r.ResourceName OR rp.ResourceKey IS NULL;

PRINT '';

-- ============================================================================
-- FIX: Update ResourceKey to match ResourceName
-- ============================================================================
PRINT 'Updating ResourceKey to match ResourceName...';

UPDATE rp
SET rp.ResourceKey = r.ResourceName
FROM RolePermissions rp
JOIN Resources r ON rp.ResourceId = r.ResourceId
WHERE rp.ResourceKey <> r.ResourceName OR rp.ResourceKey IS NULL;

DECLARE @RowsUpdated INT = @@ROWCOUNT;
PRINT '✅ Updated ' + CAST(@RowsUpdated AS NVARCHAR(10)) + ' rows';

PRINT '';

-- ============================================================================
-- AFTER: Verify the fix
-- ============================================================================
PRINT 'AFTER - Verification (should be empty if all fixed):';
SELECT 
    rp.RolePermissionId,
    rp.ResourceId,
    rp.ResourceKey,
    r.ResourceName
FROM RolePermissions rp
JOIN Resources r ON rp.ResourceId = r.ResourceId
WHERE rp.ResourceKey <> r.ResourceName;

PRINT '';

-- ============================================================================
-- Test: Check roletester permissions
-- ============================================================================
PRINT 'Testing roletester@sandhyaflames.in permissions:';
DECLARE @UserId INT = 18;

SELECT 
    rp.ResourceKey AS resourceKey,
    rp.PermissionMask AS permissionMask
FROM Users u
JOIN Roles ro ON u.RoleId = ro.RoleId
JOIN RolePermissions rp ON ro.RoleId = rp.RoleId
WHERE u.UserId = @UserId
  AND u.IsActive = 1
  AND ro.IsActive = 1;

PRINT '';
PRINT '============================================================================';
PRINT '✅ Fix completed!';
PRINT '';
PRINT 'Expected API Result:';
PRINT '  GET /api/permissions/user/18';
PRINT '  [';
PRINT '    {';
PRINT '      "resourceKey": "DailyDelivery",  ← Should now show this!';
PRINT '      "permissionMask": 1';
PRINT '    }';
PRINT '  ]';
PRINT '';
PRINT '🔄 Test the API again in Swagger!';
PRINT '============================================================================';
