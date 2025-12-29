USE [sandhyaflames]
GO

-- =============================================
-- SCHEMA MIGRATION: Add Empty/Damaged Tracking
-- Date: 2025-12-26
-- Purpose: Add EmptyReturned and DamagedReturned columns to DailyDeliveryItemActuals
-- =============================================

PRINT '========================================';
PRINT 'Starting Schema Migration...';
PRINT '========================================';

-- Step 1: Add EmptyReturned column
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'DailyDeliveryItemActuals' 
    AND COLUMN_NAME = 'EmptyReturned'
)
BEGIN
    ALTER TABLE DailyDeliveryItemActuals
    ADD EmptyReturned INT NOT NULL DEFAULT 0;
    
    PRINT '✅ Added EmptyReturned column to DailyDeliveryItemActuals';
END
ELSE
BEGIN
    PRINT '⚠️  EmptyReturned column already exists';
END
GO

-- Step 2: Add DamagedReturned column
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'DailyDeliveryItemActuals' 
    AND COLUMN_NAME = 'DamagedReturned'
)
BEGIN
    ALTER TABLE DailyDeliveryItemActuals
    ADD DamagedReturned INT NOT NULL DEFAULT 0;
    
    PRINT '✅ Added DamagedReturned column to DailyDeliveryItemActuals';
END
ELSE
BEGIN
    PRINT '⚠️  DamagedReturned column already exists';
END
GO

-- Step 3: Mark NoOfDeliveries as deprecated (keep for backward compatibility, but not used)
-- Add comment to table for future reference
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'DEPRECATED: Not used in business logic. Use NoOfInvoices instead.', 
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'DailyDeliveryItems',
    @level2type = N'COLUMN', @level2name = 'NoOfDeliveries';
GO

PRINT '✅ Marked NoOfDeliveries column as deprecated';
PRINT '========================================';
PRINT 'Schema Migration Completed!';
PRINT '========================================';

-- Verify changes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DailyDeliveryItemActuals'
AND COLUMN_NAME IN ('EmptyReturned', 'DamagedReturned')
ORDER BY ORDINAL_POSITION;
