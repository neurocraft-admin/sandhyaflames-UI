-- =============================================
-- Role Permission Management Stored Procedure
-- Date: 2025-12-27
-- =============================================

USE [sandhyaflames]
GO

-- ===============================================================
-- sp_GetRolePermissions - Get all permissions for a specific role
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetRolePermissions]
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get all resources with their permissions for this role
    -- If permission doesn't exist, default to FALSE
    SELECT 
        r.ResourceId,
        r.ResourceName,
        ISNULL(p.CanView, 0) AS CanView,
        ISNULL(p.CanCreate, 0) AS CanCreate,
        ISNULL(p.CanUpdate, 0) AS CanUpdate,
        ISNULL(p.CanDelete, 0) AS CanDelete
    FROM Resources r
    LEFT JOIN Permissions p ON r.ResourceId = p.ResourceId AND p.RoleId = @RoleId
    ORDER BY r.ResourceName;
END
GO

PRINT '✅ Created sp_GetRolePermissions';
GO
