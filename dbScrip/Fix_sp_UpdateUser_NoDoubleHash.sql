-- Update sp_UpdateUser to accept already-hashed password
-- This makes it consistent with User_Create (which also accepts pre-hashed password)

USE [sandhyaflames]
GO

ALTER PROCEDURE [dbo].[sp_UpdateUser]
    @UserId INT,
    @FullName NVARCHAR(100),
    @Email NVARCHAR(100),
    @Password NVARCHAR(255) = NULL,  -- Already hashed by backend
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
        -- Password is already hashed by backend, use it directly
        UPDATE Users
        SET FullName = @FullName,
            Email = @Email,
            PasswordHash = @Password,  -- Already hashed, no need to hash again
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

PRINT '✅ sp_UpdateUser updated - now accepts pre-hashed password from backend';
GO
