# PRODUCTION DATABASE MIGRATION GUIDE

## 📋 Overview
This guide helps migrate the database from sql-dev to sandhyaflames-vm (production) with clean admin setup.

---

## 🚀 STEP-BY-STEP MIGRATION

### Step 1: Backup Current Production DB (Safety)
```bash
# SSH into production VM
ssh nnidh@34.14.178.225

# Create backup directory if not exists
sudo mkdir -p /opt/backups

# Backup current production database
sqlcmd -S localhost,1433 -U sa -P 'YourPassword' -Q "BACKUP DATABASE [sandhyaflames] TO DISK = '/opt/backups/sandhyaflames_pre_migration_$(date +%Y%m%d_%H%M%S).bak' WITH FORMAT, COMPRESSION"
```

---

### Step 2: Backup Development Database
```bash
# SSH into dev VM (sql-dev)
ssh user@sql-dev-vm-ip

# Backup development database
sqlcmd -S localhost,1433 -U sa -P 'DevPassword' -Q "BACKUP DATABASE [sandhyaflames] TO DISK = '/tmp/sandhyaflames_dev_backup.bak' WITH FORMAT, COMPRESSION"

# Verify backup file
ls -lh /tmp/sandhyaflames_dev_backup.bak
```

---

### Step 3: Transfer Backup to Production
```bash
# From dev VM, copy to prod VM
scp /tmp/sandhyaflames_dev_backup.bak nnidh@34.14.178.225:/tmp/

# Or download to local machine, then upload to prod
# scp user@dev-vm-ip:/tmp/sandhyaflames_dev_backup.bak .
# scp sandhyaflames_dev_backup.bak nnidh@34.14.178.225:/tmp/
```

---

### Step 4: Restore Database on Production
```bash
# SSH into production VM
ssh nnidh@34.14.178.225

# Stop API service to avoid connection locks
sudo systemctl stop sandhyaflames-api.service

# Restore database (will replace existing)
sqlcmd -S localhost,1433 -U sa -P 'ProdPassword' -Q "
USE master;
GO
ALTER DATABASE [sandhyaflames] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO
RESTORE DATABASE [sandhyaflames] 
FROM DISK = '/tmp/sandhyaflames_dev_backup.bak' 
WITH REPLACE, RECOVERY;
GO
ALTER DATABASE [sandhyaflames] SET MULTI_USER;
GO
"

# Verify restore
sqlcmd -S localhost,1433 -U sa -P 'ProdPassword' -d sandhyaflames -Q "SELECT COUNT(*) as TableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
```

---

### Step 5: Clean Dummy Data & Setup Admin
```bash
# Copy cleanup scripts from workspace to VM
# (Upload PROD_Cleanup_DummyData.sql and PROD_Setup_Admin.sql to /tmp/)

# Run cleanup script
sqlcmd -S localhost,1433 -U sa -P 'ProdPassword' -d sandhyaflames -i /tmp/PROD_Cleanup_DummyData.sql

# Run admin setup script
sqlcmd -S localhost,1433 -U sa -P 'ProdPassword' -d sandhyaflames -i /tmp/PROD_Setup_Admin.sql
```

---

### Step 6: Update API Connection String
```bash
# Edit appsettings.json
sudo nano /opt/sandhyaflames-api/publish/appsettings.json

# Ensure connection string points to localhost:
# "Server=localhost,1433;Database=sandhyaflames;User Id=sa;Password=ProdPassword;TrustServerCertificate=true"
```

---

### Step 7: Start API & Verify
```bash
# Start API service
sudo systemctl start sandhyaflames-api.service

# Check status
sudo systemctl status sandhyaflames-api.service

# View logs
sudo journalctl -u sandhyaflames-api.service -n 50

# Test API connection to database
curl http://localhost:5027/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"Admin@123"}'
```

---

### Step 8: Verify from Frontend
```bash
# Open browser and test
# URL: http://34.14.178.225
# Login: admin / Admin@123
```

---

## 🔍 Verification Checklist

- [ ] Production DB backed up successfully
- [ ] Dev DB backup created and transferred
- [ ] Database restored on production
- [ ] Dummy data cleaned up
- [ ] Admin user created with correct role
- [ ] API connection string updated
- [ ] API service running without errors
- [ ] Login works from frontend
- [ ] Permissions working correctly

---

## 🔄 Rollback (If Needed)

```bash
# Stop API
sudo systemctl stop sandhyaflames-api.service

# Restore original backup
sqlcmd -S localhost,1433 -U sa -P 'ProdPassword' -Q "
USE master;
ALTER DATABASE [sandhyaflames] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [sandhyaflames] FROM DISK = '/opt/backups/sandhyaflames_pre_migration_YYYYMMDD_HHMMSS.bak' WITH REPLACE;
ALTER DATABASE [sandhyaflames] SET MULTI_USER;
"

# Start API
sudo systemctl start sandhyaflames-api.service
```

---

## 📝 Notes

- **Default Admin Credentials**: username=`admin`, password=`Admin@123`
- **Change password** after first login for security
- All dummy/test data will be removed except the admin user
- Connection string must point to **localhost,1433** (not sql-dev VM)
- Keep database backups for at least 30 days

---

**Created:** 2026-01-06  
**Purpose:** Production database migration from sql-dev to sandhyaflames-vm
