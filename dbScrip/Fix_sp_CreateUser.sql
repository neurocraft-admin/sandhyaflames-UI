-- Fix sp_CreateUser to accept PasswordHash instead of Password
-- This matches the User_Create compatibility SP

USE [sandhyaflames]
GO

ALTER PROCEDURE [dbo].[sp_CreateUser]
    @FullName NVARCHAR(100),
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),  -- Changed from @Password
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
    
    -- Password is already hashed by backend, DO NOT hash again
    -- Backend uses: PasswordHelper.ComputeSha256Hash(user.Password)
    INSERT INTO Users (FullName, Email, PasswordHash, RoleId, IsActive)
    VALUES (@FullName, @Email, @PasswordHash, @RoleId, 1);
    
    DECLARE @UserId INT = SCOPE_IDENTITY();
    
    SELECT 1 AS success, @UserId AS userId, 'User created successfully' AS message;
END
GO

PRINT '✅ sp_CreateUser updated to accept @PasswordHash';
GO
