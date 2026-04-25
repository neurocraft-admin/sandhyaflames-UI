#!/bin/bash

################################################################################
# Frontend Deployment Script - GCP Cloud Storage
# Deploys Angular app to Cloud Storage bucket
################################################################################

set -e  # Exit on any error

echo "========================================="
echo "Frontend Deployment to GCP Cloud Storage"
echo "========================================="

# Configuration
BUCKET_NAME="flamemitra-frontend"
BUILD_OUTPUT="dist/sandhyaflames-ui/browser"

# Navigate to frontend directory
echo "📂 Navigating to gas-agency-ui folder..."
cd "$(dirname "$0")/.."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build Angular application
echo "🔨 Building Angular application (production)..."
ng build --configuration production

# Check if build output exists
if [ ! -d "$BUILD_OUTPUT" ]; then
  echo "❌ Error: Build output directory not found at $BUILD_OUTPUT"
  exit 1
fi

echo "☁️  Uploading files to gs://$BUCKET_NAME..."
gsutil -m cp -r "$BUILD_OUTPUT"/* "gs://$BUCKET_NAME/"

# Set cache headers for index.html
echo "⚙️  Setting cache headers for index.html..."
gsutil -m setmeta \
  -h "Cache-Control: no-cache, no-store, must-revalidate" \
  -h "Pragma: no-cache" \
  -h "Expires: 0" \
  "gs://$BUCKET_NAME/index.html"

# Set cache headers for JavaScript files
echo "⚙️  Setting cache headers for JavaScript files..."
gsutil -m setmeta \
  -h "Cache-Control: public, max-age=31536000, immutable" \
  "gs://$BUCKET_NAME/**.js"

# Set cache headers for CSS files
echo "⚙️  Setting cache headers for CSS files..."
gsutil -m setmeta \
  -h "Cache-Control: public, max-age=31536000, immutable" \
  "gs://$BUCKET_NAME/**.css"

# Make bucket publicly accessible (if not already)
echo "🔓 Ensuring bucket is publicly accessible..."
gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME" 2>/dev/null || true

echo "========================================="
echo "✅ Deployment Successful!"
echo "========================================="
echo ""
echo "🌐 Bucket URL: https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo "🌐 Public URL: https://flamemitra.in (after DNS setup)"
echo ""
echo "Next steps:"
echo "1. Configure DNS for flamemitra.in to point to the bucket"
echo "2. Set up Cloud CDN for better performance (optional)"
echo "========================================="
