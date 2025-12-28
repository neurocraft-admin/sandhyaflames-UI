-- Check if the user was created correctly with full email
SELECT 
    UserId,
    FullName,
    Email,
    RoleId,
    IsActive,
    CreatedAt
FROM Users
WHERE Email LIKE '%nidheesh%';

-- If email is NULL or incorrect, update it
UPDATE Users
SET Email = 'nidheesh@sandhyaflames.in'
WHERE Email = 'nidheesh' OR Email IS NULL OR Email LIKE 'nidheesh%' AND Email NOT LIKE '%@%';

-- Verify the update
SELECT 
    UserId,
    FullName,
    Email,
    RoleId,
    IsActive
FROM Users
WHERE Email = 'nidheesh@sandhyaflames.in';
