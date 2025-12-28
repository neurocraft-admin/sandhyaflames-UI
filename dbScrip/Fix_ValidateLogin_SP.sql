-- ============================================================================
-- Fix sp_ValidateLogin - Use Roles table instead of UserRoles
-- ============================================================================

USE [sandhyaflames];
GO

PRINT '============================================================================';
PRINT 'Fixing sp_ValidateLogin Stored Procedure';
PRINT '============================================================================';
PRINT '';
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ValidateLogin]
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        U.UserId,
        U.FullName,
        U.Email,
        R.RoleName
    FROM dbo.Users U
    INNER JOIN dbo.Roles R ON U.RoleId = R.RoleId  -- Changed from UserRoles to Roles
    WHERE U.Email = @Email 
      AND U.PasswordHash = @PasswordHash 
      AND U.IsActive = 1
      AND R.IsActive = 1;  -- Also check role is active
END
GO

PRINT '✅ Fixed sp_ValidateLogin to use Roles table';
PRINT '';

-- Test the fix
PRINT 'Testing login for roletester@sandhyaflames.in:';
DECLARE @TestEmail NVARCHAR(100) = 'roletester@sandhyaflames.in';
DECLARE @TestPasswordHash NVARCHAR(255);

-- Get the actual password hash
SELECT @TestPasswordHash = PasswordHash 
FROM Users 
WHERE Email = @TestEmail;

-- Test login
EXEC sp_ValidateLogin @Email = @TestEmail, @PasswordHash = @TestPasswordHash;

PRINT '';
PRINT '============================================================================';
PRINT '✅ sp_ValidateLogin fixed!';
PRINT '';
PRINT 'Changes made:';
PRINT '  - Changed JOIN from UserRoles to Roles table';
PRINT '  - Added R.IsActive = 1 check';
PRINT '';
PRINT '🔄 Try logging in as roletester@sandhyaflames.in now!';
PRINT '============================================================================';
