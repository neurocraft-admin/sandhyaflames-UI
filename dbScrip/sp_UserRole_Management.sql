-- =============================================
-- STORED PROCEDURES FOR USER AND ROLE MANAGEMENT
-- Date: 2025-12-27
-- Purpose: CRUD operations for Users and Roles
-- =============================================

USE [sandhyaflames]
GO

-- ═══════════════════════════════════════════════════════════════
-- USER MANAGEMENT STORED PROCEDURES
-- ═══════════════════════════════════════════════════════════════

-- ===============================================================
-- SP 1: List All Users
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_ListUsers]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.UserId AS userId,
        u.FullName AS fullName,
        u.Email AS email,
        u.RoleId AS roleId,
        r.RoleName AS roleName,
        u.IsActive AS isActive
    FROM Users u
    LEFT JOIN Roles r ON u.RoleId = r.RoleId
    WHERE u.IsActive = 1
    ORDER BY u.FullName;
END
GO

PRINT '✅ Created sp_ListUsers';
GO

-- ===============================================================
-- SP 2: Get User By ID
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetUserById]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.UserId AS userId,
        u.FullName AS fullName,
        u.Email AS email,
        u.RoleId AS roleId,
        r.RoleName AS roleName,
        u.IsActive AS isActive
    FROM Users u
    LEFT JOIN Roles r ON u.RoleId = r.RoleId
    WHERE u.UserId = @UserId;
END
GO

PRINT '✅ Created sp_GetUserById';
GO

-- ===============================================================
-- SP 3: Create User
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_CreateUser]
    @FullName NVARCHAR(100),
    @Email NVARCHAR(100),
    @Password NVARCHAR(255),
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
    BEGIN
        SELECT 0 AS success, 'Email already exists' AS message;
        RETURN;
    END
    
    -- Hash password (simple SHA256 - consider using BCrypt in production)
    DECLARE @HashedPassword NVARCHAR(255);
    SET @HashedPassword = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @Password), 2);
    
    -- Insert user
    INSERT INTO Users (FullName, Email, PasswordHash, RoleId, IsActive)
    VALUES (@FullName, @Email, @HashedPassword, @RoleId, 1);
    
    DECLARE @UserId INT = SCOPE_IDENTITY();
    
    SELECT 1 AS success, @UserId AS userId, 'User created successfully' AS message;
END
GO

PRINT '✅ Created sp_CreateUser';
GO

-- ===============================================================
-- SP 4: Update User
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_UpdateUser]
    @UserId INT,
    @FullName NVARCHAR(100),
    @Email NVARCHAR(100),
    @Password NVARCHAR(255) = NULL,  -- Optional, only if changing password
    @RoleId INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if email exists for another user
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email AND UserId <> @UserId)
    BEGIN
        SELECT 0 AS success, 'Email already exists for another user' AS message;
        RETURN;
    END
    
    -- Update user
    IF @Password IS NOT NULL AND @Password <> ''
    BEGIN
        -- Update with new password
        DECLARE @HashedPassword NVARCHAR(255);
        SET @HashedPassword = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @Password), 2);
        
        UPDATE Users
        SET FullName = @FullName,
            Email = @Email,
            PasswordHash = @HashedPassword,
            RoleId = @RoleId,
            IsActive = @IsActive,
            UpdatedAt = GETDATE()
        WHERE UserId = @UserId;
    END
    ELSE
    BEGIN
        -- Update without changing password
        UPDATE Users
        SET FullName = @FullName,
            Email = @Email,
            RoleId = @RoleId,
            IsActive = @IsActive,
            UpdatedAt = GETDATE()
        WHERE UserId = @UserId;
    END
    
    SELECT 1 AS success, 'User updated successfully' AS message;
END
GO

PRINT '✅ Created sp_UpdateUser';
GO

-- ===============================================================
-- SP 5: Delete User (Soft Delete)
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_DeleteUser]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Soft delete by setting IsActive = 0
    UPDATE Users
    SET IsActive = 0,
        UpdatedAt = GETDATE()
    WHERE UserId = @UserId;
    
    SELECT 1 AS success, 'User deleted successfully' AS message;
END
GO

PRINT '✅ Created sp_DeleteUser';
GO

-- ═══════════════════════════════════════════════════════════════
-- ROLE MANAGEMENT STORED PROCEDURES
-- ═══════════════════════════════════════════════════════════════

-- ===============================================================
-- SP 6: List All Roles
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_ListRoles]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.RoleId AS roleId,
        r.RoleName AS roleName,
        r.Description AS description,
        r.IsActive AS isActive,
        COUNT(u.UserId) AS userCount
    FROM Roles r
    LEFT JOIN Users u ON r.RoleId = u.RoleId AND u.IsActive = 1
    WHERE r.IsActive = 1
    GROUP BY r.RoleId, r.RoleName, r.Description, r.IsActive
    ORDER BY r.RoleName;
END
GO

PRINT '✅ Created sp_ListRoles';
GO

-- ===============================================================
-- SP 7: Get Role By ID
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetRoleById]
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.RoleId AS roleId,
        r.RoleName AS roleName,
        r.Description AS description,
        r.IsActive AS isActive,
        COUNT(u.UserId) AS userCount
    FROM Roles r
    LEFT JOIN Users u ON r.RoleId = u.RoleId AND u.IsActive = 1
    WHERE r.RoleId = @RoleId
    GROUP BY r.RoleId, r.RoleName, r.Description, r.IsActive;
END
GO

PRINT '✅ Created sp_GetRoleById';
GO

-- ===============================================================
-- SP 8: Create Role
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_CreateRole]
    @RoleName NVARCHAR(50),
    @Description NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if role name already exists
    IF EXISTS (SELECT 1 FROM Roles WHERE RoleName = @RoleName)
    BEGIN
        SELECT 0 AS success, 'Role name already exists' AS message;
        RETURN;
    END
    
    -- Insert role
    INSERT INTO Roles (RoleName, Description, IsActive)
    VALUES (@RoleName, @Description, 1);
    
    DECLARE @RoleId INT = SCOPE_IDENTITY();
    
    SELECT 1 AS success, @RoleId AS roleId, 'Role created successfully' AS message;
END
GO

PRINT '✅ Created sp_CreateRole';
GO

-- ===============================================================
-- SP 9: Update Role
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_UpdateRole]
    @RoleId INT,
    @RoleName NVARCHAR(50),
    @Description NVARCHAR(255),
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if role name exists for another role
    IF EXISTS (SELECT 1 FROM Roles WHERE RoleName = @RoleName AND RoleId <> @RoleId)
    BEGIN
        SELECT 0 AS success, 'Role name already exists for another role' AS message;
        RETURN;
    END
    
    -- Update role
    UPDATE Roles
    SET RoleName = @RoleName,
        Description = @Description,
        IsActive = @IsActive,
        UpdatedAt = GETDATE()
    WHERE RoleId = @RoleId;
    
    SELECT 1 AS success, 'Role updated successfully' AS message;
END
GO

PRINT '✅ Created sp_UpdateRole';
GO

-- ===============================================================
-- SP 10: Delete Role (Soft Delete)
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[sp_DeleteRole]
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if any active users are assigned to this role
    DECLARE @UserCount INT;
    SELECT @UserCount = COUNT(*) FROM Users WHERE RoleId = @RoleId AND IsActive = 1;
    
    IF @UserCount > 0
    BEGIN
        SELECT 0 AS success, 
               'Cannot delete role with ' + CAST(@UserCount AS NVARCHAR) + ' active user(s)' AS message;
        RETURN;
    END
    
    -- Soft delete by setting IsActive = 0
    UPDATE Roles
    SET IsActive = 0,
        UpdatedAt = GETDATE()
    WHERE RoleId = @RoleId;
    
    SELECT 1 AS success, 'Role deleted successfully' AS message;
END
GO

PRINT '✅ Created sp_DeleteRole';
GO

PRINT '';
PRINT '========================================';
PRINT 'All User & Role SPs Created Successfully!';
PRINT '10 stored procedures created';
PRINT '========================================';
