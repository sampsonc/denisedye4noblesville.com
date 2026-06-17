#!/bin/bash

# Git deployment script for Denise Dye campaign website
# Based on deployment patterns from other domains

set -e

echo "🗳️  Deploying Denise Dye Campaign Website..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "Error: Not in a git repository. Run 'git init' first."
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "Warning: You have uncommitted changes."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

# Add all changes
echo "Adding files..."
git add .

# Commit with timestamp
timestamp=$(date '+%Y-%m-%d %H:%M:%S')
echo "Committing changes..."
git commit -m "Campaign update - $timestamp" || echo "No changes to commit"

# Push to remote
echo "Pushing to remote..."
git push origin main

echo "✅ Git deployment complete!"

# If you have a remote server, uncomment and configure the following:
# echo "Deploying to production server..."
# rsync -avz --delete ./ user@yourserver.com:/path/to/website/
# echo "✅ Production deployment complete!"

echo ""
echo "🎯 Campaign website deployed successfully!"
echo "Visit: https://denisedye4noblesville.com (or your configured domain)"
echo ""