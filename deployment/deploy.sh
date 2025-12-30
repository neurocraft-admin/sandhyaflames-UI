#!/bin/bash
# ============================================================================
# SANDHYA FLAMES - COMPLETE DEPLOYMENT SCRIPT
# GCP Ubuntu 22.04 - Single VM Deployment
# ============================================================================
# This script deploys both Angular Frontend and .NET Core API
# Usage: sudo ./deploy.sh [frontend|backend|all]
# ============================================================================

set -e  # Exit on any error

# ============================================================================
# CONFIGURATION - UPDATE THESE VARIABLES
# ============================================================================

# Git Repositories
FRONTEND_REPO="https://github.com/neurocraft-admin/sandhyaflames-UI.git"
BACKEND_REPO="https://github.com/neurocraft-admin/Ssandhyflames-WebAPI.git"
BRANCH="main"  # Production branch

# Deployment Paths (Production VM)
FRONTEND_DEPLOY_PATH="/var/www/sandhyaflames-frontend"
BACKEND_DEPLOY_PATH="/opt/sandhyaflames-api"
FRONTEND_BUILD_PATH="$FRONTEND_DEPLOY_PATH/dist/sandhyaflames-ui/browser"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Service Names
API_SERVICE="sandhyaflames-api.service"

# Web Server
WEB_SERVER="nginx"

# VM Configuration
PUBLIC_IP="34.14.178.225"
DB_HOST="localhost,1433"
API_PORT="5027"  # Backend API port
SSL_CERT_PATH="/home/nnidh/ssl/sandhyaflames.crt"
SSL_KEY_PATH="/home/nnidh/ssl/sandhyaflames.key"

# Backup Paths
BACKUP_DIR="/opt/backups/sandhyaflames-$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Please run as root (use sudo)"
        exit 1
    fi
}

create_backup() {
    log_info "Creating backup at $BACKUP_DIR..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup frontend if exists
    if [ -d "$FRONTEND_BUILD_PATH" ]; then
        cp -r "$FRONTEND_BUILD_PATH" "$BACKUP_DIR/frontend-backup"
        log_info "Frontend backed up"
    fi
    
    # Backup backend if exists
    if [ -d "$BACKEND_DEPLOY_PATH" ]; then
        cp -r "$BACKEND_DEPLOY_PATH" "$BACKUP_DIR/backend-backup"
        log_info "Backend backed up"
    fi
    
    # Backup database (optional)
    # sqlcmd -S localhost -U sa -P YourPassword -Q "BACKUP DATABASE [sandhyaflames] TO DISK = '$BACKUP_DIR/db-backup.bak'"
}

# ============================================================================
# FRONTEND DEPLOYMENT
# ============================================================================

deploy_frontend() {
    log_info "========================================="
    log_info "DEPLOYING ANGULAR FRONTEND"
    log_info "========================================="
    
    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        log_info "Installing Node.js 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
    log_info "Node version: $(node -v)"
    log_info "NPM version: $(npm -v)"
    
    # Clone or pull repository
    if [ -d "$FRONTEND_DEPLOY_PATH/.git" ]; then
        log_info "Updating existing repository..."
        cd "$FRONTEND_DEPLOY_PATH"
        git fetch origin
        git reset --hard origin/$BRANCH
        git clean -fd
    else
        log_info "Cloning repository..."
        mkdir -p "$FRONTEND_DEPLOY_PATH"
        git clone -b $BRANCH "$FRONTEND_REPO" "$FRONTEND_DEPLOY_PATH"
        cd "$FRONTEND_DEPLOY_PATH"
    fi
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Build production
    log_info "Building Angular app for production..."
    npm run build
    
    # Set permissions
    log_info "Setting permissions..."
    chown -R www-data:www-data "$FRONTEND_BUILD_PATH"
    chmod -R 755 "$FRONTEND_BUILD_PATH"
    
    # Configure Nginx
    configure_nginx
    
    log_info "Frontend deployment completed!"
}

configure_nginx() {
    log_info "Configuring Nginx..."
    
    # Create Nginx config if doesn't exist
    if [ ! -f "$NGINX_SITES/sandhyaflames-frontend" ]; then
        cat > "$NGINX_SITES/sandhyaflames-frontend" <<EOF
# Redirect HTTP to HTTPS
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    return 301 https://\$host\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl;
    server_name _;

    ssl_certificate $SSL_CERT_PATH;
    ssl_certificate_key $SSL_KEY_PATH;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root $FRONTEND_BUILD_PATH;
    index index.html;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Angular routing - redirect all to index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:$API_PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
        
        # Enable site
        ln -sf "$NGINX_SITES/sandhyaflames-frontend" "$NGINX_ENABLED/sandhyaflames-frontend"
    fi
    
    # Test and reload Nginx
    nginx -t && systemctl reload nginx
    log_info "Nginx configured and reloaded"
}

# ============================================================================
# BACKEND DEPLOYMENT (.NET Core API)
# ============================================================================

deploy_backend() {
    log_info "========================================="
    log_info "DEPLOYING .NET CORE API"
    log_info "========================================="
    
    # Install .NET SDK if not present
    if ! command -v dotnet &> /dev/null; then
        log_info "Installing .NET 9.0 SDK..."
        wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
        chmod +x dotnet-install.sh
        ./dotnet-install.sh --channel 9.0
        ln -s ~/.dotnet/dotnet /usr/local/bin/dotnet
    fi
    
    log_info ".NET version: $(dotnet --version)"
    
    # Clone or pull repository
    if [ -d "$BACKEND_DEPLOY_PATH/.git" ]; then
        log_info "Updating existing repository..."
        cd "$BACKEND_DEPLOY_PATH"
        git fetch origin
        git reset --hard origin/$BRANCH
        git clean -fd
    else
        log_info "Cloning repository..."
        mkdir -p "$BACKEND_DEPLOY_PATH"
        git clone -b $BRANCH "$BACKEND_REPO" "$BACKEND_DEPLOY_PATH"
        cd "$BACKEND_DEPLOY_PATH"
    fi
    
    # Build and publish
    log_info "Building .NET Core API..."
    dotnet restore
    dotnet build --configuration Release
    dotnet publish --configuration Release --output "$BACKEND_DEPLOY_PATH/publish"
    
    # Create systemd service
    create_api_service
    
    # Restart service
    log_info "Restarting API service..."
    systemctl daemon-reload
    systemctl restart "$API_SERVICE"
    systemctl enable "$API_SERVICE"
    
    # Check status
    if systemctl is-active --quiet "$API_SERVICE"; then
        log_info "API service is running"
    else
        log_error "API service failed to start"
        journalctl -u "$API_SERVICE" -n 50 --no-pager
        exit 1
    fi
    
    log_info "Backend deployment completed!"
}

create_api_service() {
    log_info "Creating systemd service..."
    
    # Find the main DLL (assumes single .dll in publish folder)
    API_DLL=$(find "$BACKEND_DEPLOY_PATH/publish" -maxdepth 1 -name "*.dll" ! -name "*.Views.dll" ! -name "*.PrecompiledViews.dll" | head -1)
    
    if [ -z "$API_DLL" ]; then
        log_error "Could not find API DLL in publish folder"
        exit 1
    fi
    
    log_info "Using API DLL: $API_DLL"
    
    cat > "/etc/systemd/system/$API_SERVICE" <<EOF
[Unit]
Description=Sandhya Flames .NET 9 WebAPI
After=network.target mssql-server.service

[Service]
Type=notify
User=www-data
WorkingDirectory=$BACKEND_DEPLOY_PATH/publish
ExecStart=/usr/local/bin/dotnet $API_DLL
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=sandhyaflames-api
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false
Environment=ASPNETCORE_URLS=http://localhost:$API_PORT

[Install]
WantedBy=multi-user.target
EOF
    
    log_info "Systemd service created"
}

# ============================================================================
# DATABASE MIGRATIONS
# ============================================================================

run_migrations() {
    log_info "========================================="
    log_info "RUNNING DATABASE MIGRATIONS"
    log_info "========================================="
    
    # Apply SQL scripts from dbScrip folder
    cd "$FRONTEND_DEPLOY_PATH/dbScrip"
    
    # Use sqlcmd to run migrations (if available)
    # Example: sqlcmd -S localhost -U sa -P YourPassword -i migration.sql
    
    log_warn "Manual database migrations required. Check dbScrip folder."
}

# ============================================================================
# HEALTH CHECKS
# ============================================================================

health_check() {
    log_info "========================================="
    log_info "RUNNING HEALTH CHECKS"
    log_info "========================================="
    
    # Check Nginx
    if systemctl is-active --quiet nginx; then
        log_info "✓ Nginx is running"
    else
        log_error "✗ Nginx is not running"
    fi
    
    # Check API service
    if systemctl is-active --quiet "$API_SERVICE"; then
        log_info "✓ API service is running"
    else
        log_error "✗ API service is not running"
    fi
    
    # Check API endpoint
    if curl -f http://localhost:$API_PORT/api/health &> /dev/null; then
        log_info "✓ API health endpoint responding"
    else
        log_warn "✗ API health endpoint not responding"
    fi
    
    # Check frontend (HTTPS)
    if curl -f -k https://localhost/ &> /dev/null; then
        log_info "✓ Frontend is accessible"
    else
        log_warn "✗ Frontend is not accessible"
    fi
    
    # Check disk space
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        log_info "✓ Disk usage: ${DISK_USAGE}%"
    else
        log_warn "✗ Disk usage high: ${DISK_USAGE}%"
    fi
}

# ============================================================================
# MAIN DEPLOYMENT LOGIC
# ============================================================================

main() {
    check_root
    
    DEPLOY_TYPE="${1:-all}"
    
    log_info "Starting deployment: $DEPLOY_TYPE"
    log_info "Branch: $BRANCH"
    
    # Create backup
    create_backup
    
    case "$DEPLOY_TYPE" in
        frontend)
            deploy_frontend
            ;;
        backend)
            deploy_backend
            ;;
        all)
            deploy_frontend
            deploy_backend
            ;;
        *)
            log_error "Invalid deployment type. Use: frontend|backend|all"
            exit 1
            ;;
    esac
    
    # Health checks
    health_check
    
    log_info "========================================="
    log_info "DEPLOYMENT COMPLETED SUCCESSFULLY!"
    log_info "Backup location: $BACKUP_DIR"
    log_info "========================================="
}

# Run main function
main "$@"
