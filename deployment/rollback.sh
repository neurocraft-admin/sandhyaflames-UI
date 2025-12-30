#!/bin/bash
# ============================================================================
# ROLLBACK SCRIPT - Restore from backup
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root (use sudo)"
    exit 1
fi

# List available backups
BACKUP_BASE="/opt/backups"
log_info "Available backups:"
ls -lht "$BACKUP_BASE" | grep "^d" | head -10

echo ""
read -p "Enter backup directory name (e.g., sandhya-20250129_143000): " BACKUP_NAME

BACKUP_DIR="$BACKUP_BASE/$BACKUP_NAME"

if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

log_info "Rolling back from: $BACKUP_DIR"

# Rollback frontend
if [ -d "$BACKUP_DIR/frontend-backup" ]; then
    log_info "Restoring frontend..."
    rm -rf /var/www/sandhyaflames-frontend/dist
    cp -r "$BACKUP_DIR/frontend-backup" /var/www/sandhyaflames-frontend/dist/sandhya-flames
    systemctl reload nginx
    log_info "Frontend restored"
fi

# Rollback backend
if [ -d "$BACKUP_DIR/backend-backup" ]; then
    log_info "Restoring backend..."
    systemctl stop sandhyaflames-api.service
    rm -rf /opt/sandhyaflames-api/publish
    cp -r "$BACKUP_DIR/backend-backup" /opt/sandhyaflames-api
    systemctl start sandhyaflames-api.service
    log_info "Backend restored"
fi

log_info "Rollback completed!"
