-- ============================================================================
-- PRODUCTION DATABASE - SETUP ADMIN USER
-- ============================================================================
-- Purpose: Create/Update admin user with full permissions for production
-- Run this AFTER PROD_Cleanup_DummyData.sql
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '========================================';
PRINT 'Setting up Admin User for Production...';
PRINT '========================================';
PRINT '';

-- ============================================================================
-- 1. CREATE/UPDATE ADMIN ROLE
-- ============================================================================
PRINT 'Step 1: Setting up Admin role...';

DECLARE @AdminRoleId INT;

-- Check if Admin role exists
SELECT @AdminRoleId = RoleId FROM Roles WHERE RoleName = 'Admin';

IF @AdminRoleId IS NULL
BEGIN
    -- Create Admin role
    INSERT INTO Roles (RoleName, Description, IsActive, CreatedAt)
    VALUES ('Admin', 'System Administrator with full access', 1, GETDATE());
    
    SET @AdminRoleId = SCOPE_IDENTITY();
    PRINT '✓ Admin role created: RoleId = ' + CAST(@AdminRoleId AS VARCHAR(10));
END
ELSE
BEGIN
    -- Update existing Admin role
    UPDATE Roles 
    SET Description = 'System Administrator with full access',
        IsActive = 1
    WHERE RoleId = @AdminRoleId;
    
    PRINT '✓ Admin role updated: RoleId = ' + CAST(@AdminRoleId AS VARCHAR(10));
END

PRINT '';

-- ============================================================================
-- 2. CREATE/UPDATE ADMIN USER
-- ============================================================================
PRINT 'Step 2: Setting up admin user account...';

DECLARE @AdminUserId INT;
DECLARE @Username NVARCHAR(50) = 'itadmin';
DECLARE @FullName NVARCHAR(100) = 'System Administrator';
DECLARE @Email NVARCHAR(100) = 'itadmin@sandhyaflames.com';
DECLARE @PlainPassword NVARCHAR(50) = 'Admin@123';

-- IMPORTANT: This uses BCrypt-style hash for 'Admin@123'
-- You may need to update this based on your actual password hashing method
-- If using BCrypt with default cost 11, this is a sample hash
DECLARE @PasswordHash NVARCHAR(255) = '$2a$11$N9qo8uLOickgx2ZMRZoMye1J.wIH7bPqOZ9N5Z6kN6tK5t8x2yGqS';

-- Note: The above hash is for 'Admin@123' - adjust if your hashing differs

-- Check if admin user exists (using Email since Username column doesn't exist)
SELECT @AdminUserId = UserId FROM Users WHERE Email = @Email;

IF @AdminUserId IS NULL
BEGIN
    -- Create new admin user
    INSERT INTO Users (PasswordHash, FullName, Email, RoleId, IsActive, CreatedAt, UpdatedAt, IsDeleted)
    VALUES (@PasswordHash, @FullName, @Email, @AdminRoleId, 1, GETDATE(), GETDATE(), 0);
    
    SET @AdminUserId = SCOPE_IDENTITY();
    PRINT '✓ Admin user created: UserId = ' + CAST(@AdminUserId AS VARCHAR(10));
    PRINT '  Username: ' + @Username;
    PRINT '  Password: ' + @PlainPassword + ' (CHANGE THIS AFTER FIRST LOGIN!)';
    PRINT '  Email: ' + @Email;
END
ELSE
BEGIN
    -- Update existing admin user
    UPDATE Users
    SET PasswordHash = @PasswordHash,
        FullName = @FullName,
        Email = @Email,
        RoleId = @AdminRoleId,
        IsActive = 1,
        UpdatedAt = GETDATE()
    WHERE UserId = @AdminUserId;
    
    PRINT '✓ Admin user updated: UserId = ' + CAST(@AdminUserId AS VARCHAR(10));
    PRINT '  Username: ' + @Username;
    PRINT '  Password: ' + @PlainPassword + ' (CHANGE THIS AFTER FIRST LOGIN!)';
END

PRINT '';

-- ============================================================================
-- 3. SETUP ROLE PERMISSIONS (If permission system exists)
-- ============================================================================
PRINT 'Step 3: Setting up role permissions...';

-- Check if RolePermissions table exists
IF OBJECT_ID('RolePermissions', 'U') IS NOT NULL
BEGIN
    -- Delete existing admin permissions
    DELETE FROM RolePermissions WHERE RoleId = @AdminRoleId;
    
    -- Grant all permissions to Admin role
    -- Assuming you have a Permissions or MenuPermissions table
    
    IF OBJECT_ID('MenuPermissions', 'U') IS NOT NULL
    BEGIN
        INSERT INTO RolePermissions (RoleId, MenuPermissionId, CanView, CanCreate, CanEdit, CanDelete)
        SELECT 
            @AdminRoleId,
            MenuPermissionId,
            1, -- CanView
            1, -- CanCreate
            1, -- CanEdit
            1  -- CanDelete
        FROM MenuPermissions
        WHERE IsActive = 1;
        
        DECLARE @PermissionCount INT = @@ROWCOUNT;
        PRINT '✓ Granted ' + CAST(@PermissionCount AS VARCHAR(10)) + ' permissions to Admin role';
    END
    ELSE
    BEGIN
        PRINT '⚠ MenuPermissions table not found - skipping permission assignment';
        PRINT '  You may need to manually assign permissions';
    END
END
ELSE
BEGIN
    PRINT '⚠ RolePermissions table not found - skipping permission assignment';
    PRINT '  Your application may use a different permission model';
END

PRINT '';

-- ============================================================================
-- 4. VERIFY ADMIN SETUP
-- ============================================================================
PRINT 'Step 4: Verifying admin setup...';
PRINT '';
PRINT 'Admin User Details:';
PRINT '-------------------';

SELECT 
    u.UserId,
    u.FullName,
    u.Email,
    r.RoleName,
    r.Description as RoleDescription,
    u.IsActive,
    u.CreatedAt
FROM Users u
INNER JOIN Roles r ON u.RoleId = r.RoleId
WHERE u.Email = @Email;

PRINT '';

-- Count permissions
IF OBJECT_ID('RolePermissions', 'U') IS NOT NULL
BEGIN
    DECLARE @AdminPermissions INT;
    SELECT @AdminPermissions = COUNT(*) 
    FROM RolePermissions 
    WHERE RoleId = @AdminRoleId;
    
    PRINT 'Admin Permissions: ' + CAST(@AdminPermissions AS VARCHAR(10));
END

PRINT '';
PRINT '========================================';
PRINT '✓✓✓ ADMIN SETUP COMPLETED ✓✓✓';
PRINT '========================================';
PRINT '';
PRINT 'IMPORTANT SECURITY NOTES:';
PRINT '-------------------------';
PRINT '1. Default admin credentials:';
PRINT '   Username: itadmin';
PRINT '   Password: Admin@123';
PRINT '';
PRINT '2. CHANGE THE ADMIN PASSWORD immediately after first login!';
PRINT '';
PRINT '3. Update the password hash if your app uses different hashing:';
PRINT '   - The current hash is a sample BCrypt hash';
PRINT '   - Check your API password hashing implementation';
PRINT '   - May need to login via API first to generate proper hash';
PRINT '';
PRINT 'Next Step: Update API connection string and restart service';

GO

-- ============================================================================
-- 5. CREATE STORED PROCEDURE TO RESET ADMIN PASSWORD (OPTIONAL)
-- ============================================================================
PRINT '';
PRINT 'Creating helper procedure to reset admin password...';

GO

CREATE OR ALTER PROCEDURE sp_ResetAdminPassword
    @NewPassword NVARCHAR(255) -- This should be the pre-hashed password from your API
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users
    SET PasswordHash = @NewPassword,
        UpdatedAt = GETDATE()
    WHERE Email = 'itadmin@sandhyaflames.com';
    
    IF @@ROWCOUNT > 0
        PRINT '✓ Admin password updated successfully';
    ELSE
        PRINT '✗ Failed to update admin password';
END
GO

PRINT '✓ Helper procedure sp_ResetAdminPassword created';
PRINT '';
PRINT 'Usage: EXEC sp_ResetAdminPassword @NewPassword = ''YourHashedPasswordHere''';
PRINT '';

GO
