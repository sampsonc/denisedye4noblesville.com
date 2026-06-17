#!/bin/bash

# Full deployment script for Denise Dye campaign website
# Handles both local builds and remote deployment

set -e

echo "🗳️  Full Site Deployment - Denise Dye for School Board"
echo "=================================================="

# Configuration - Update these values for your setup
REMOTE_HOST="${REMOTE_HOST:-your-server.com}"
REMOTE_USER="${REMOTE_USER:-username}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/html/sb}"
LOCAL_PATH="$(pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    print_error "index.html not found. Are you in the campaign website directory?"
    exit 1
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check for required files
required_files=("index.html" "css/main.css" "js/main.js" "forms/volunteer.html" "forms/contact.html")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    print_error "Missing required files:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

print_success "All required files present"

# Check for placeholder content that needs to be updated
print_status "Checking for placeholder content..."

# Check for placeholder images
if ls images/candidates/*.jpg >/dev/null 2>&1; then
    print_success "Candidate photos found"
else
    print_warning "No candidate photos found in images/candidates/"
    print_warning "Add denise.PNG to images/candidates/"
fi

# Check for placeholder contact info
if grep -q "info@dyesampsonforschools.com" index.html; then
    print_warning "Update contact email in index.html"
fi

if grep -q "(317) 555-1234" index.html; then
    print_warning "Update phone number in index.html"
fi

if grep -qi "sampson\|elizabeth" index.html; then
    print_warning "Stray two-candidate reference found in index.html"
fi

# Create backup
print_status "Creating backup..."
backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
cp -r . "$backup_dir/" 2>/dev/null || print_warning "Backup creation failed (non-critical)"

# Optimize files for production
print_status "Optimizing files for production..."

# Create a temporary production directory
prod_dir=$(mktemp -d)
cp -r . "$prod_dir/"

# Remove development files
rm -rf "$prod_dir/.git" "$prod_dir/backups" "$prod_dir/deployment" "$prod_dir/.*" 2>/dev/null || true

# Minify CSS if minification tool is available
if command -v css-minify &> /dev/null; then
    print_status "Minifying CSS..."
    css-minify "$prod_dir/css/main.css" > "$prod_dir/css/main.min.css"
    mv "$prod_dir/css/main.min.css" "$prod_dir/css/main.css"
fi

# Update file permissions
find "$prod_dir" -type f -name "*.html" -exec chmod 644 {} \;
find "$prod_dir" -type f -name "*.css" -exec chmod 644 {} \;
find "$prod_dir" -type f -name "*.js" -exec chmod 644 {} \;
find "$prod_dir" -type f -name "*.jpg" -o -name "*.png" -o -name "*.ico" -exec chmod 644 {} \; 2>/dev/null || true

# Deploy to remote server (if configured)
if [ "$1" == "--deploy" ] || [ "$1" == "-d" ]; then
    if [ "$REMOTE_HOST" != "your-server.com" ]; then
        print_status "Deploying to remote server: $REMOTE_HOST"

        # Test SSH connection
        if ssh -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'Connection successful'" &>/dev/null; then
            print_success "SSH connection successful"

            # Deploy files
            rsync -avz --delete \
                --exclude='.git*' \
                --exclude='node_modules' \
                --exclude='backups' \
                --exclude='deployment' \
                "$prod_dir/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

            print_success "Files deployed to remote server"

            # Set correct permissions on remote
            ssh "$REMOTE_USER@$REMOTE_HOST" "find $REMOTE_PATH -type d -exec chmod 755 {} \; && find $REMOTE_PATH -type f -exec chmod 644 {} \;"

            print_success "Remote permissions updated"
        else
            print_error "Cannot connect to remote server. Check your SSH configuration."
            print_warning "Files prepared in: $prod_dir"
            exit 1
        fi
    else
        print_warning "Remote deployment not configured. Update REMOTE_HOST, REMOTE_USER, and REMOTE_PATH in this script."
        print_status "Files prepared for manual deployment in: $prod_dir"
    fi
else
    print_status "Files prepared for deployment in: $prod_dir"
    print_status "Run with --deploy flag to deploy to remote server"
fi

# Cleanup
if [ "$1" == "--deploy" ] || [ "$1" == "-d" ]; then
    rm -rf "$prod_dir"
fi

# Git operations (if in git repo)
if [ -d .git ]; then
    print_status "Updating git repository..."
    git add .
    git commit -m "Campaign deployment $(date '+%Y-%m-%d %H:%M:%S')" || print_warning "No changes to commit"

    if [ "$1" == "--push" ] || [ "$1" == "-p" ] || [ "$1" == "--deploy" ] || [ "$1" == "-d" ]; then
        git push origin main || print_warning "Git push failed"
        print_success "Changes pushed to git repository"
    fi
fi

print_success "Deployment preparation complete!"

echo ""
echo "=================================================="
echo "📋 DEPLOYMENT SUMMARY"
echo "=================================================="
echo "✅ Pre-deployment checks passed"
echo "✅ Files optimized for production"
echo "✅ Backup created in: backups/"

if [ "$1" == "--deploy" ] || [ "$1" == "-d" ]; then
    echo "✅ Deployed to remote server"
    echo ""
    echo "🎯 Website URL: https://denisedye4noblesville.com (or your configured domain)"
else
    echo "⏳ Ready for deployment (use --deploy flag)"
fi

echo ""
echo "Next steps:"
echo "- Test the website thoroughly"
echo "- Update candidate photos if placeholders are being used"
echo "- Update contact information"
echo "- Set up email forms to work with your backend"
echo "- Configure domain and SSL certificate"
echo ""