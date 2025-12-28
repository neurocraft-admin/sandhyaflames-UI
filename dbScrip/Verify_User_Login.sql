-- Verify user creation and password hash
USE [sandhyaflames]
GO

-- Check if user exists
SELECT 
    UserId,
    FullName,
    Email,
    PasswordHash,
    RoleId,
    IsActive,
    CreatedAt
FROM Users
WHERE Email LIKE '%hydra%';

-- Check what the password hash should be for 'mypass'
-- Backend uses SHA256, result should be in uppercase hex
SELECT 
    'Expected Hash' as Info,
    CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'mypass'), 2) AS PasswordHash;

-- Compare with actual user's hash
SELECT 
    u.Email,
    u.PasswordHash AS ActualHash,
    CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'mypass'), 2) AS ExpectedHash,
    CASE 
        WHEN u.PasswordHash = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'mypass'), 2) 
        THEN 'MATCH ✅' 
        ELSE 'MISMATCH ❌' 
    END AS HashComparison,
    u.IsActive,
    CASE WHEN u.IsActive = 1 THEN 'Active ✅' ELSE 'Inactive ❌' END AS ActiveStatus
FROM Users u
WHERE Email LIKE '%hydra%';
