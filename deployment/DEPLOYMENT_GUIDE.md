# ============================================================================
# SANDHYA FLAMES - GCP DEPLOYMENT GUIDE
# Ubuntu 22.04 Single VM Deployment
# ============================================================================

## 📋 PREREQUISITES

### 1. VM Setup
- **OS:** Ubuntu 22.04 (ubuntu-2204-jammy-v20251002)
- **Network Tags:** default, http-server, https-server, sandhya-prod-vm
- **Public IP:** 34.14.178.225
- **Firewall:** Allow ports 80, 443, 5000 (API), 1433 (SQL Server)

### 2. Software Requirements (Already Installed)
- ✅ NGINX (web server)
- ✅ .NET 9 SDK
- ✅ SQL Server Express (localhost,1433)
- ✅ Git

### 3. Current Production Setup
- **Frontend:** /var/www/sandhyaflames-frontend
- **Backend:** /opt/sandhyaflames-api
- **Service:** sandhyaflames-api.service
- **Database:** localhost,1433 (sandhyaflames)

---

## 🚀 INITIAL SETUP (One-time)

### Step 1: Create Deployment User
```bash
# Directories already exist on production VM:
# /var/www/sandhyaflames-frontend
# /opt/sandhyaflames-api
# /opt/backups

# Verify permissions
ls -la /var/www/sandhyaflames-frontend
ls -la /opt/sandhyaflames-api
```

### Step 2: Configure Git Access
```bash
# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "your-email@example.com"

# Add to GitHub: cat ~/.ssh/id_ed25519.pub
# Then test: ssh -T git@github.com
```

### Step 3: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
node -v  # Should show v20.x
```

### Step 4: Install .NET 9.0
```bash
# Check if already installed
dotnet --version  # Should show 9.0.x

# If not installed:
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 9.0
sudo ln -s ~/.dotnet/dotnet /usr/local/bin/dotnet
dotnet --version  # Verify 9.0.x
```

---

## 📦 DEPLOYMENT PROCESS

### Method 1: Using Automated Script

1. **Upload deployment scripts to VM:**
```bash
# From your local machine:
scp -r deployment/* user@your-vm-ip:/home/user/deploy/

# On VM:
cd /home/user/deploy
chmod +x deploy.sh rollback.sh
```

2. **Configure the script:**
Edit `deploy.sh` and update:
- `FRONTEND_REPO`: Your GitHub frontend repository URL
- `BACKEND_REPO`: Your GitHub backend repository URL
- `BRANCH`: Branch to deploy (main/production)
- API service name
- Deployment paths

3. **Run deployment:**
```bash
# Deploy both frontend and backend
sudo ./deploy.sh all

# Deploy only frontend
sudo ./deploy.sh frontend

# Deploy only backend
sudo ./deploy.sh backend
```

### Method 2: Manual Deployment

#### FRONTEND DEPLOYMENT:

```bash
# 1. Navigate to frontend directory
cd /var/www/sandhyaflames-frontend

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm ci

# 4. Build for production
npm run build

# 5. Set permissions
sudo chown -R www-data:www-data dist/
sudo chmod -R 755 dist/

# 6. Reload Nginx
sudo systemctl reload nginx
```

#### BACKEND DEPLOYMENT:

```bash
# 1. Navigate to API directory
cd /opt/sandhyaflames-api

# 2. Pull latest code
git pull origin main

# 3. Build and publish
dotnet restore
dotnet build --configuration Release
dotnet publish --configuration Release --output ./publish

# 4. Restart service
sudo systemctl restart sandhyaflames-api.service
sudo systemctl status sandhyaflames-api.service
```

---

## 🔧 NGINX CONFIGURATION

Current configuration at `/etc/nginx/sites-available/sandhyaflames-frontend`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 34.14.178.225;  # Replace with domain when available
    
    root /var/www/sandhyaflames-frontend/dist/sandhya-flames;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Angular routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API reverse proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/sandhyaflames-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔧 SYSTEMD SERVICE (API)

Current service at `/etc/systemd/system/sandhyaflames-api.service`:

```ini
[Unit]
Description=Sandhya Flames .NET 9 WebAPI
After=network.target mssql-server.service

[Service]
Type=notify
User=www-data
WorkingDirectory=/opt/sandhyaflames-api/publish
ExecStart=/usr/local/bin/dotnet /opt/sandhyaflames-api/publish/GasAgencyAPI.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=sandhyaflames-api

# Environment variables
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false
Environment=ASPNETCORE_URLS=http://localhost:5000

[Install]
WantedBy=multi-user.target
```

Manage the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sandhyaflames-api.service
sudo systemctl start sandhyaflames-api.service
sudo systemctl status sandhyaflames-api.service
```

---

## 🔍 MONITORING & LOGS

### View API Logs:
```bash
# Real-time logs
sudo journalctl -u sandhya-api.service -f

# Last 100 lines
sudo journalctl -u sandhya-api.service -n 100

# Logs since today
sudo journalctl -u sandhya-api.service --since today
```

### View Nginx Logs:
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Service Status:
```bash
sudo systemctl status nginx
sudo systemctl status sandhya-api.service
sudo systemctl status mssql-server
```

---

## 🔄 ROLLBACK PROCEDURE

If deployment fails:

```bash
# Use rollback script
sudo ./rollback.sh

# Or manually:
# 1. List backups
ls -lht /opt/backups/

# 2. Restore frontend
sudo cp -r /opt/backups/sandhya-YYYYMMDD_HHMMSS/frontend-backup/* /var/www/sandhya-frontend/dist/
sudo systemctl reload nginx

# 3. Restore backend
sudo systemctl stop sandhya-api.service
sudo cp -r /opt/backups/sandhya-YYYYMMDD_HHMMSS/backend-backup/* /opt/sandhya-api/
sudo systemctl start sandhya-api.service
```

---

## 🔒 SSL/HTTPS SETUP (Production)

### Using Certbot (Let's Encrypt):

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

---

## 📊 HEALTH CHECKS

Create `/opt/scripts/health-check.sh`:

```bash
#!/bin/bash
curl -f http://localhost/ || echo "Frontend DOWN"
curl -f http://localhost:5000/api/health || echo "API DOWN"
systemctl is-active nginx || echo "Nginx DOWN"
systemctl is-active sandhya-api.service || echo "API Service DOWN"
df -h | grep -E '^/dev/' | awk '{print $5 " " $6}'
```

Add to crontab:
```bash
# Run health check every 5 minutes
*/5 * * * * /opt/scripts/health-check.sh >> /var/log/sandhya-health.log 2>&1
```

---

## 🗄️ DATABASE MIGRATIONS

```bash
# Navigate to database scripts
cd /var/www/sandhya-frontend/dbScrip

# Run migration (example)
sqlcmd -S localhost -U sa -P 'YourPassword' -d sandhyaflames -i migration_script.sql
```

---

## 🚨 TROUBLESHOOTING

### Frontend not loading:
```bash
# Check Nginx config
sudo nginx -t

# Check permissions
ls -la /var/www/sandhya-frontend/dist/

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### API not responding:
```bash
# Check service status
sudo systemctl status sandhya-api.service

# Check logs
sudo journalctl -u sandhya-api.service -n 100

# Check if port is listening
sudo netstat -tulpn | grep :5000

# Test API directly
curl http://localhost:5000/api/health
```

### Database connection issues:
```bash
# Check SQL Server status
sudo systemctl status mssql-server

# Test connection
sqlcmd -S localhost -U sa

# Check connection string in appsettings.json
cat /opt/sandhya-api/publish/appsettings.Production.json
```

---

## 📝 DEPLOYMENT CHECKLIST

- [ ] Backup current deployment
- [ ] Update Git repositories (frontend + backend)
- [ ] Build Angular app (`npm run build`)
- [ ] Build .NET API (`dotnet publish`)
- [ ] Run database migrations (if any)
- [ ] Restart API service
- [ ] Reload Nginx
- [ ] Run health checks
- [ ] Test frontend in browser
- [ ] Test API endpoints
- [ ] Monitor logs for errors
- [ ] Document deployment (version, date, changes)

---

## 🔗 USEFUL COMMANDS

```bash
# Quick deploy frontend only
cd /var/www/sandhya-frontend && git pull && npm ci && npm run build && sudo systemctl reload nginx

# Quick deploy backend only
cd /opt/sandhya-api && git pull && dotnet publish -c Release -o ./publish && sudo systemctl restart sandhya-api.service

# View all services
sudo systemctl list-units --type=service --state=running | grep sandhya

# Clean up old backups (keep last 10)
ls -t /opt/backups/ | tail -n +11 | xargs -I {} rm -rf /opt/backups/{}
```

---

## 📞 SUPPORT

For issues, check:
1. Service logs: `sudo journalctl -u sandhya-api.service -f`
2. Nginx logs: `/var/log/nginx/error.log`
3. Application logs: Check app-specific logging directory
4. System resources: `htop` or `top`
5. Disk space: `df -h`

---

**Last Updated:** 2025-12-29  
**Deployed Version:** UI v5.5.11 | API v1.0.0
