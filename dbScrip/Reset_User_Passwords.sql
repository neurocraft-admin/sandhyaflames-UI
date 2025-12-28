-- Reset password for users created with old double-hashing logic
USE [sandhyaflames]
GO

-- Check the current hash vs expected hash for 'mypass'
SELECT 
    UserId,
    FullName,
    Email,
    PasswordHash AS CurrentHash,
    CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'mypass'), 2) AS ExpectedHash,
    CASE 
        WHEN PasswordHash = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'mypass'), 2) 
        THEN '✅ MATCH' 
        ELSE '❌ MISMATCH - Need to reset' 
    END AS Status
FROM Users
WHERE Email = 'chakra@sandhyaflames.in';

-- Reset password to 'mypass' with correct hash
UPDATE Users
SET PasswordHash = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'mypass'), 2),
    UpdatedAt = GETDATE()
WHERE Email = 'chakra@sandhyaflames.in';

PRINT '✅ Password reset for chakra@sandhyaflames.in';

-- Verify the update
SELECT 
    UserId,
    FullName,
    Email,
    PasswordHash AS NewHash,
    CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'mypass'), 2) AS ExpectedHash,
    CASE 
        WHEN PasswordHash = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'mypass'), 2) 
        THEN '✅ NOW MATCHES' 
        ELSE '❌ STILL WRONG' 
    END AS Status
FROM Users
WHERE Email = 'chakra@sandhyaflames.in';
