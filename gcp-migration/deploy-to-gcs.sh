#!/bin/bash

################################################################################
# Frontend Deployment Script - GCP Cloud Storage
# FlameMitra - Angular to Cloud Storage
# Run from: gas-agency-ui root folder
################################################################################

set -e  # Exit on any error

echo "========================================="
echo "Frontend Deployment to GCP Cloud Storage"
echo "========================================="

# Configuration
BUCKET_NAME="flamemitra-frontend"
BUILD_OUTPUT="dist/sandhyaflames-ui/browser"

# Navigate to frontend directory (gas-agency-ui root)
echo "📂 Navigating to project root..."
cd "$(dirname "$0")/.."

# Verify we are in the right folder
if [ ! -f "angular.json" ]; then
  echo "❌ Error: angular.json not found."
  echo "Make sure you run this from gas-agency-ui folder"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build Angular application
echo "🔨 Building Angular application (production)..."
ng build --configuration production

# Check if build output exists
if [ ! -d "$BUILD_OUTPUT" ]; then
  echo "❌ Error: Build output not found at $BUILD_OUTPUT"
  echo "Check angular.json outputPath setting"
  exit 1
fi

echo "📁 Build output size:"
du -sh "$BUILD_OUTPUT"

# Upload all files to bucket
echo "☁️  Uploading files to gs://$BUCKET_NAME..."
gsutil -m cp -r "$BUILD_OUTPUT"/* "gs://$BUCKET_NAME/"

# Set cache headers for index.html (no cache - always fresh)
echo "⚙️  Setting cache headers for index.html..."
gsutil setmeta \
  -h "Cache-Control: no-cache, no-store, must-revalidate" \
  -h "Pragma: no-cache" \
  -h "Expires: 0" \
  "gs://$BUCKET_NAME/index.html"

# Set cache headers for JS files (1 year - hashed filenames)
echo "⚙️  Setting cache headers for JS files..."
gsutil ls "gs://$BUCKET_NAME/**.js" 2>/dev/null | while read file; do
  gsutil setmeta \
    -h "Cache-Control: public, max-age=31536000, immutable" \
    "$file"
done

# Set cache headers for CSS files (1 year - hashed filenames)
echo "⚙️  Setting cache headers for CSS files..."
gsutil ls "gs://$BUCKET_NAME/**.css" 2>/dev/null | while read file; do
  gsutil setmeta \
    -h "Cache-Control: public, max-age=31536000, immutable" \
    "$file"
done

# Ensure bucket is publicly readable
echo "🔓 Ensuring bucket is publicly readable..."
gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME" 2>/dev/null || true

echo "========================================="
echo "✅ Frontend Deployed Successfully!"
echo "========================================="
echo ""
echo "🌐 Direct bucket URL:"
echo "   https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo ""
echo "🌐 Production URL (after DNS setup):"
echo "   https://flamemitra.in"
echo ""
echo "📋 Next steps:"
echo "   1. Verify bucket: gsutil ls gs://$BUCKET_NAME"
echo "   2. Test bucket URL in browser"
echo "   3. Configure Load Balancer for flamemitra.in"
echo "========================================="
