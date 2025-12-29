-- =============================================
-- Customer Credit Management Stored Procedures
-- =============================================

USE [sandhyaflames]
GO

-- =============================================
-- 1. Create CustomerCredit Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CustomerCredit]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CustomerCredit](
        [CreditId] [int] IDENTITY(1,1) NOT NULL,
        [CustomerId] [int] NOT NULL,
        [CreditLimit] [decimal](18, 2) NOT NULL DEFAULT 0,
        [CreditUsed] [decimal](18, 2) NOT NULL DEFAULT 0,
        [CreditAvailable] [decimal](18, 2) NOT NULL DEFAULT 0,
        [OutstandingAmount] [decimal](18, 2) NOT NULL DEFAULT 0,
        [TotalPaid] [decimal](18, 2) NOT NULL DEFAULT 0,
        [LastPaymentDate] [datetime] NULL,
        [LastPaymentAmount] [decimal](18, 2) NULL,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedAt] [datetime] NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] [datetime] NULL,
        CONSTRAINT [PK_CustomerCredit] PRIMARY KEY CLUSTERED ([CreditId] ASC),
        CONSTRAINT [FK_CustomerCredit_Customers] FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customers]([CustomerId]),
        CONSTRAINT [UX_CustomerCredit_Customer] UNIQUE ([CustomerId])
    )

    CREATE NONCLUSTERED INDEX [IX_CustomerCredit_CustomerId] ON [dbo].[CustomerCredit]([CustomerId])
    CREATE NONCLUSTERED INDEX [IX_CustomerCredit_IsActive] ON [dbo].[CustomerCredit]([IsActive])
END
GO

-- =============================================
-- 2. Create CreditTransactions Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreditTransactions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CreditTransactions](
        [TransactionId] [int] IDENTITY(1,1) NOT NULL,
        [CustomerId] [int] NOT NULL,
        [TransactionType] [nvarchar](20) NOT NULL, -- Credit, Debit, Payment
        [Amount] [decimal](18, 2) NOT NULL,
        [ReferenceNumber] [nvarchar](50) NULL,
        [Description] [nvarchar](500) NULL,
        [TransactionDate] [datetime] NOT NULL DEFAULT GETDATE(),
        [CreatedBy] [nvarchar](100) NULL,
        [CreatedAt] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_CreditTransactions] PRIMARY KEY CLUSTERED ([TransactionId] ASC),
        CONSTRAINT [FK_CreditTransactions_Customers] FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customers]([CustomerId])
    )

    CREATE NONCLUSTERED INDEX [IX_CreditTransactions_CustomerId] ON [dbo].[CreditTransactions]([CustomerId])
    CREATE NONCLUSTERED INDEX [IX_CreditTransactions_Date] ON [dbo].[CreditTransactions]([TransactionDate])
END
GO

-- =============================================
-- 3. Create CreditPayments Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreditPayments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CreditPayments](
        [PaymentId] [int] IDENTITY(1,1) NOT NULL,
        [CustomerId] [int] NOT NULL,
        [PaymentAmount] [decimal](18, 2) NOT NULL,
        [PaymentMode] [nvarchar](20) NOT NULL, -- Cash, Card, UPI, Cheque, Bank Transfer
        [ReferenceNumber] [nvarchar](50) NULL,
        [PaymentDate] [date] NOT NULL,
        [Remarks] [nvarchar](500) NULL,
        [CreatedAt] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_CreditPayments] PRIMARY KEY CLUSTERED ([PaymentId] ASC),
        CONSTRAINT [FK_CreditPayments_Customers] FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customers]([CustomerId])
    )

    CREATE NONCLUSTERED INDEX [IX_CreditPayments_CustomerId] ON [dbo].[CreditPayments]([CustomerId])
    CREATE NONCLUSTERED INDEX [IX_CreditPayments_Date] ON [dbo].[CreditPayments]([PaymentDate])
END
GO

-- =============================================
-- 4. SP: Get All Customer Credits
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetCustomerCredits]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cc.CreditId,
        cc.CustomerId,
        c.CustomerName,
        cc.CreditLimit,
        cc.CreditUsed,
        cc.CreditAvailable,
        cc.OutstandingAmount,
        cc.TotalPaid,
        cc.LastPaymentDate,
        cc.LastPaymentAmount,
        cc.IsActive,
        cc.CreatedAt
    FROM dbo.CustomerCredit cc
    INNER JOIN dbo.Customers c ON cc.CustomerId = c.CustomerId
    ORDER BY c.CustomerName;
END
GO

-- =============================================
-- 5. SP: Get Credit by Customer ID
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetCreditByCustomerId]
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cc.CreditId,
        cc.CustomerId,
        c.CustomerName,
        cc.CreditLimit,
        cc.CreditUsed,
        cc.CreditAvailable,
        cc.OutstandingAmount,
        cc.TotalPaid,
        cc.LastPaymentDate,
        cc.LastPaymentAmount,
        cc.IsActive,
        cc.CreatedAt
    FROM dbo.CustomerCredit cc
    INNER JOIN dbo.Customers c ON cc.CustomerId = c.CustomerId
    WHERE cc.CustomerId = @CustomerId;
END
GO

-- =============================================
-- 6. SP: Save Credit Limit (Insert/Update)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_SaveCreditLimit]
    @CustomerId INT,
    @CreditLimit DECIMAL(18, 2),
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate customer exists
        IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId = @CustomerId)
        BEGIN
            RAISERROR('Customer not found', 16, 1);
            RETURN;
        END

        -- Check if credit record exists
        IF EXISTS (SELECT 1 FROM dbo.CustomerCredit WHERE CustomerId = @CustomerId)
        BEGIN
            -- UPDATE existing credit record
            UPDATE dbo.CustomerCredit
            SET 
                CreditLimit = @CreditLimit,
                CreditAvailable = @CreditLimit - CreditUsed,
                IsActive = @IsActive,
                UpdatedAt = GETDATE()
            WHERE CustomerId = @CustomerId;

            SELECT 1 AS success, 'Credit limit updated successfully' AS message;
        END
        ELSE
        BEGIN
            -- INSERT new credit record
            INSERT INTO dbo.CustomerCredit (
                CustomerId,
                CreditLimit,
                CreditUsed,
                CreditAvailable,
                OutstandingAmount,
                TotalPaid,
                IsActive,
                CreatedAt
            )
            VALUES (
                @CustomerId,
                @CreditLimit,
                0,
                @CreditLimit,
                0,
                0,
                @IsActive,
                GETDATE()
            );

            SELECT 1 AS success, 'Credit limit created successfully' AS message;
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
-- 7. SP: Record Payment
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_RecordCreditPayment]
    @CustomerId INT,
    @PaymentAmount DECIMAL(18, 2),
    @PaymentMode NVARCHAR(20),
    @ReferenceNumber NVARCHAR(50) = NULL,
    @PaymentDate DATE,
    @Remarks NVARCHAR(500) = NULL,
    @CreatedBy NVARCHAR(100) = 'System'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate customer exists
        IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId = @CustomerId)
        BEGIN
            RAISERROR('Customer not found', 16, 1);
            RETURN;
        END

        -- Validate payment amount
        IF @PaymentAmount <= 0
        BEGIN
            RAISERROR('Payment amount must be greater than zero', 16, 1);
            RETURN;
        END

        -- Ensure credit record exists
        IF NOT EXISTS (SELECT 1 FROM dbo.CustomerCredit WHERE CustomerId = @CustomerId)
        BEGIN
            INSERT INTO dbo.CustomerCredit (CustomerId, CreditLimit, CreditUsed, CreditAvailable, OutstandingAmount, TotalPaid)
            VALUES (@CustomerId, 0, 0, 0, 0, 0);
        END

        -- Insert payment record
        INSERT INTO dbo.CreditPayments (
            CustomerId,
            PaymentAmount,
            PaymentMode,
            ReferenceNumber,
            PaymentDate,
            Remarks,
            CreatedAt
        )
        VALUES (
            @CustomerId,
            @PaymentAmount,
            @PaymentMode,
            @ReferenceNumber,
            @PaymentDate,
            @Remarks,
            GETDATE()
        );

        -- Insert transaction record
        INSERT INTO dbo.CreditTransactions (
            CustomerId,
            TransactionType,
            Amount,
            ReferenceNumber,
            Description,
            TransactionDate,
            CreatedBy,
            CreatedAt
        )
        VALUES (
            @CustomerId,
            'Payment',
            @PaymentAmount,
            @ReferenceNumber,
            CONCAT('Payment received via ', @PaymentMode, 
                   CASE WHEN @Remarks IS NOT NULL THEN ' - ' + @Remarks ELSE '' END),
            @PaymentDate,
            @CreatedBy,
            GETDATE()
        );

        -- Update customer credit
        UPDATE dbo.CustomerCredit
        SET 
            OutstandingAmount = OutstandingAmount - @PaymentAmount,
            TotalPaid = TotalPaid + @PaymentAmount,
            LastPaymentDate = @PaymentDate,
            LastPaymentAmount = @PaymentAmount,
            UpdatedAt = GETDATE()
        WHERE CustomerId = @CustomerId;

        -- Recalculate credit available
        UPDATE dbo.CustomerCredit
        SET CreditAvailable = CreditLimit - (CreditUsed - TotalPaid)
        WHERE CustomerId = @CustomerId;

        SELECT 1 AS success, 'Payment recorded successfully' AS message;

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
-- 8. SP: Get Transactions by Customer
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetCreditTransactionsByCustomer]
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ct.TransactionId,
        ct.CustomerId,
        c.CustomerName,
        ct.TransactionType,
        ct.Amount,
        ct.ReferenceNumber,
        ct.Description,
        ct.TransactionDate,
        ct.CreatedBy,
        ct.CreatedAt
    FROM dbo.CreditTransactions ct
    INNER JOIN dbo.Customers c ON ct.CustomerId = c.CustomerId
    WHERE ct.CustomerId = @CustomerId
    ORDER BY ct.TransactionDate DESC, ct.TransactionId DESC;
END
GO

-- =============================================
-- 9. SP: Get Payment History
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_GetCreditPaymentHistory]
    @CustomerId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cp.PaymentId,
        cp.CustomerId,
        c.CustomerName,
        cp.PaymentAmount,
        cp.PaymentMode,
        cp.ReferenceNumber,
        cp.PaymentDate,
        cp.Remarks,
        cp.CreatedAt
    FROM dbo.CreditPayments cp
    INNER JOIN dbo.Customers c ON cp.CustomerId = c.CustomerId
    WHERE @CustomerId IS NULL OR cp.CustomerId = @CustomerId
    ORDER BY cp.PaymentDate DESC, cp.PaymentId DESC;
END
GO

-- =============================================
-- 10. SP: Add Credit Usage (for sales/invoices)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_AddCreditUsage]
    @CustomerId INT,
    @Amount DECIMAL(18, 2),
    @ReferenceNumber NVARCHAR(50) = NULL,
    @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate customer exists
        IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId = @CustomerId)
        BEGIN
            RAISERROR('Customer not found', 16, 1);
            RETURN;
        END

        -- Ensure credit record exists
        IF NOT EXISTS (SELECT 1 FROM dbo.CustomerCredit WHERE CustomerId = @CustomerId)
        BEGIN
            INSERT INTO dbo.CustomerCredit (CustomerId, CreditLimit, CreditUsed, CreditAvailable, OutstandingAmount, TotalPaid)
            VALUES (@CustomerId, 0, 0, 0, 0, 0);
        END

        -- Check credit availability
        DECLARE @Available DECIMAL(18, 2);
        SELECT @Available = CreditAvailable FROM dbo.CustomerCredit WHERE CustomerId = @CustomerId;

        IF @Available < @Amount
        BEGIN
            RAISERROR('Insufficient credit available', 16, 1);
            RETURN;
        END

        -- Insert transaction record
        INSERT INTO dbo.CreditTransactions (
            CustomerId,
            TransactionType,
            Amount,
            ReferenceNumber,
            Description,
            TransactionDate,
            CreatedAt
        )
        VALUES (
            @CustomerId,
            'Debit',
            @Amount,
            @ReferenceNumber,
            @Description,
            GETDATE(),
            GETDATE()
        );

        -- Update customer credit
        UPDATE dbo.CustomerCredit
        SET 
            CreditUsed = CreditUsed + @Amount,
            CreditAvailable = CreditAvailable - @Amount,
            OutstandingAmount = OutstandingAmount + @Amount,
            UpdatedAt = GETDATE()
        WHERE CustomerId = @CustomerId;

        SELECT 1 AS success, 'Credit usage recorded successfully' AS message;

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

PRINT 'Customer Credit Management stored procedures created successfully!'
