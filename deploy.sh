#!/bin/bash

# Personal Website S3 Deployment Script
# Usage: ./deploy.sh <bucket-name>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if bucket name is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: Please provide a bucket name${NC}"
    echo "Usage: ./deploy.sh <bucket-name>"
    exit 1
fi

BUCKET_NAME=$1
REGION="us-east-1"  # Change this to your preferred region

echo -e "${BLUE}🚀 Starting deployment to S3 bucket: ${BUCKET_NAME}${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi

echo -e "${YELLOW}📋 Checking if bucket exists...${NC}"

# Check if bucket exists
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    echo -e "${YELLOW}📦 Creating bucket: $BUCKET_NAME${NC}"
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION
else
    echo -e "${GREEN}✅ Bucket exists: $BUCKET_NAME${NC}"
fi

echo -e "${YELLOW}🌐 Configuring static website hosting...${NC}"

# Enable static website hosting
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html

echo -e "${YELLOW}📤 Uploading files...${NC}"

# Upload files to S3
aws s3 sync . "s3://$BUCKET_NAME" \
    --exclude "*.md" \
    --exclude "deploy.sh" \
    --exclude "s3-website.json" \
    --exclude ".git/*" \
    --exclude ".DS_Store" \
    --delete

echo -e "${YELLOW}🔒 Setting bucket policy for public access...${NC}"

# Create bucket policy for public read access
cat > s3-website.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

# Apply bucket policy
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file://s3-website.json

echo -e "${YELLOW}🌍 Configuring CORS...${NC}"

# Create CORS configuration
cat > cors.json << EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": []
        }
    ]
}
EOF

# Apply CORS configuration
aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration file://cors.json

# Get website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Website URL: $WEBSITE_URL${NC}"
echo -e "${YELLOW}💡 Note: It may take a few minutes for changes to propagate${NC}"

# Clean up temporary files
rm -f s3-website.json cors.json

echo -e "${GREEN}🎉 Your personal website is now live!${NC}"
