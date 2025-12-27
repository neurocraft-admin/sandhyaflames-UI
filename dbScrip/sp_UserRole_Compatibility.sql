-- =============================================
-- COMPATIBILITY STORED PROCEDURES
-- Create SPs with names matching your backend code
-- Date: 2025-12-27
-- =============================================

USE [sandhyaflames]
GO

-- ===============================================================
-- User_Create (called by backend MapUserManagementRoutes)
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[User_Create]
    @FullName NVARCHAR(100),
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
    BEGIN
        SELECT 0 AS success, 'Email already exists' AS message;
        RETURN -1;
    END
    
    -- Insert user (password is already hashed by backend)
    INSERT INTO Users (FullName, Email, PasswordHash, RoleId, IsActive)
    VALUES (@FullName, @Email, @PasswordHash, @RoleId, 1);
    
    DECLARE @UserId INT = SCOPE_IDENTITY();
    
    SELECT @UserId AS UserId;
END
GO

PRINT '✅ Created User_Create';
GO

-- ===============================================================
-- User_Update (called by backend MapUserManagementRoutes)
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[User_Update]
    @UserId INT,
    @FullName NVARCHAR(100),
    @Email NVARCHAR(100),
    @RoleId INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if email exists for another user
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email AND UserId <> @UserId)
    BEGIN
        SELECT 0 AS success, 'Email already exists for another user' AS message;
        RETURN -1;
    END
    
    -- Update user (without changing password)
    UPDATE Users
    SET FullName = @FullName,
        Email = @Email,
        RoleId = @RoleId,
        IsActive = @IsActive,
        UpdatedAt = GETDATE()
    WHERE UserId = @UserId;
    
    SELECT @@ROWCOUNT AS Affected;
END
GO

PRINT '✅ Created User_Update';
GO

-- ===============================================================
-- User_SoftDelete (called by backend MapUserManagementRoutes)
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[User_SoftDelete]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Soft delete by setting IsActive = 0
    UPDATE Users
    SET IsActive = 0,
        UpdatedAt = GETDATE()
    WHERE UserId = @UserId;
    
    SELECT @@ROWCOUNT AS Affected;
END
GO

PRINT '✅ Created User_SoftDelete';
GO

-- ===============================================================
-- Role_Create (called by backend MapRoleManagementRoutes)
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[Role_Create]
    @RoleName NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if role name already exists
    IF EXISTS (SELECT 1 FROM Roles WHERE RoleName = @RoleName)
    BEGIN
        SELECT 0 AS success, 'Role name already exists' AS message;
        RETURN -1;
    END
    
    -- Insert role
    INSERT INTO Roles (RoleName, IsActive)
    VALUES (@RoleName, 1);
    
    DECLARE @RoleId INT = SCOPE_IDENTITY();
    
    SELECT @RoleId AS RoleId;
END
GO

PRINT '✅ Created Role_Create';
GO

-- ===============================================================
-- Role_Update (called by backend MapRoleManagementRoutes)
-- ===============================================================
CREATE OR ALTER PROCEDURE [dbo].[Role_Update]
    @RoleId INT,
    @RoleName NVARCHAR(50),
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if role name exists for another role
    IF EXISTS (SELECT 1 FROM Roles WHERE RoleName = @RoleName AND RoleId <> @RoleId)
    BEGIN
        SELECT 0 AS success, 'Role name already exists for another role' AS message;
        RETURN -1;
    END
    
    -- Update role
    UPDATE Roles
    SET RoleName = @RoleName,
        IsActive = @IsActive,
        UpdatedAt = GETDATE()
    WHERE RoleId = @RoleId;
    
    SELECT @@ROWCOUNT AS Affected;
END
GO

PRINT '✅ Created Role_Update';
GO

PRINT '';
PRINT '========================================';
PRINT 'Compatibility SPs Created Successfully!';
PRINT '5 stored procedures created';
PRINT '========================================';
