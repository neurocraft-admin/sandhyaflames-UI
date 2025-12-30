-- =============================================
-- Customer Management Stored Procedures
-- =============================================

USE [sandhyaflames]
GO

-- =============================================
-- 1. Create Customers Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Customers](
        [CustomerId] [int] IDENTITY(1,1) NOT NULL,
        [CustomerName] [nvarchar](100) NOT NULL,
        [Phone] [nvarchar](15) NOT NULL,
        [Email] [nvarchar](100) NULL,
        [Address] [nvarchar](500) NOT NULL,
        [City] [nvarchar](100) NOT NULL,
        [Pincode] [nvarchar](10) NOT NULL,
        [GSTNumber] [nvarchar](20) NULL,
        [CustomerType] [nvarchar](20) NOT NULL DEFAULT 'Retail',
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedAt] [datetime] NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] [datetime] NULL,
        CONSTRAINT [PK_Customers] PRIMARY KEY CLUSTERED ([CustomerId] ASC)
    )

    -- Create indexes
    CREATE NONCLUSTERED INDEX [IX_Customers_Phone] ON [dbo].[Customers]([Phone])
    CREATE NONCLUSTERED INDEX [IX_Customers_IsActive] ON [dbo].[Customers]([IsActive])
    CREATE NONCLUSTERED INDEX [IX_Customers_City] ON [dbo].[Customers]([City])
END
GO

-- =============================================
-- 2. Stored Procedure: Get All Customers
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetCustomers]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerId,
        CustomerName,
        Phone,
        Email,
        Address,
        City,
        Pincode,
        GSTNumber,
        CustomerType,
        IsActive,
        CreatedAt
    FROM dbo.Customers
    ORDER BY CustomerName;
END
GO

-- =============================================
-- 3. Stored Procedure: Get Customer By Id
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetCustomerById]
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerId,
        CustomerName,
        Phone,
        Email,
        Address,
        City,
        Pincode,
        GSTNumber,
        CustomerType,
        IsActive,
        CreatedAt
    FROM dbo.Customers
    WHERE CustomerId = @CustomerId;
END
GO

-- =============================================
-- 4. Stored Procedure: Save Customer (Insert/Update)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_SaveCustomer]
    @CustomerId INT = 0,
    @CustomerName NVARCHAR(100),
    @Phone NVARCHAR(15),
    @Email NVARCHAR(100) = NULL,
    @Address NVARCHAR(500),
    @City NVARCHAR(100),
    @Pincode NVARCHAR(10),
    @GSTNumber NVARCHAR(20) = NULL,
    @CustomerType NVARCHAR(20) = 'Retail',
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate input
        IF LTRIM(RTRIM(@CustomerName)) = ''
        BEGIN
            RAISERROR('Customer name is required', 16, 1);
            RETURN;
        END

        

        -- Check for duplicate phone (excluding current customer)
        -- Only check if phone is not empty/null
        IF LTRIM(RTRIM(@Phone)) != ''
        BEGIN
            IF EXISTS (
                SELECT 1 FROM dbo.Customers 
                WHERE LTRIM(RTRIM(Phone)) = LTRIM(RTRIM(@Phone))
                AND CustomerId != @CustomerId
                AND IsActive = 1
            )
            BEGIN
                RAISERROR('A customer with this phone number already exists', 16, 1);
                RETURN;
            END
        END

        IF @CustomerId = 0
        BEGIN
            -- INSERT new customer
            INSERT INTO dbo.Customers (
                CustomerName, 
                Phone, 
                Email, 
                Address, 
                City, 
                Pincode, 
                GSTNumber, 
                CustomerType, 
                IsActive,
                CreatedAt
            )
            VALUES (
                @CustomerName, 
                @Phone, 
                @Email, 
                @Address, 
                @City, 
                @Pincode, 
                @GSTNumber, 
                @CustomerType, 
                @IsActive,
                GETDATE()
            );

            SET @CustomerId = SCOPE_IDENTITY();
            
            SELECT 1 AS success, 'Customer created successfully' AS message;
        END
        ELSE
        BEGIN
            -- UPDATE existing customer
            IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId = @CustomerId)
            BEGIN
                RAISERROR('Customer not found', 16, 1);
                RETURN;
            END

            UPDATE dbo.Customers
            SET 
                CustomerName = @CustomerName,
                Phone = @Phone,
                Email = @Email,
                Address = @Address,
                City = @City,
                Pincode = @Pincode,
                GSTNumber = @GSTNumber,
                CustomerType = @CustomerType,
                IsActive = @IsActive,
                UpdatedAt = GETDATE()
            WHERE CustomerId = @CustomerId;

            SELECT 1 AS success, 'Customer updated successfully' AS message;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

-- =============================================
-- 5. Stored Procedure: Soft Delete Customer
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_SoftDeleteCustomer]
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId = @CustomerId)
        BEGIN
            RAISERROR('Customer not found', 16, 1);
            RETURN;
        END

        UPDATE dbo.Customers
        SET 
            IsActive = 0,
            UpdatedAt = GETDATE()
        WHERE CustomerId = @CustomerId;

        SELECT 1 AS success, 'Customer deactivated successfully' AS message;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

-- =============================================
-- 6. Stored Procedure: Get Active Customers (for dropdowns)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetActiveCustomers]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerId,
        CustomerName,
        Phone,
        City,
        CustomerType
    FROM dbo.Customers
    WHERE IsActive = 1
    ORDER BY CustomerName;
END
GO

PRINT 'Customer Management stored procedures created successfully!'
