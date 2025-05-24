#!/bin/bash

# Google Cloud Platform Deployment Script
echo "🚀 Starting deployment to Google Cloud Platform..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    echo "📥 Download from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set your project ID (replace with your actual project ID)
PROJECT_ID="your-project-id"
echo "📝 Using project: $PROJECT_ID"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable appengine.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create App Engine app if it doesn't exist
echo "🏗️  Setting up App Engine..."
gcloud app create --region=us-central1 || echo "App Engine app already exists"

# Deploy the application
echo "🚀 Deploying application..."
gcloud app deploy --quiet

# Get the deployed URL
APP_URL=$(gcloud app describe --format="value(defaultHostname)")
echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://$APP_URL"
echo "🏥 Health check: https://$APP_URL/api/health"

echo ""
echo "📋 Next steps:"
echo "1. Update your Cloud SQL authorized networks if needed"
echo "2. Set up your environment variables in the Google Cloud Console"
echo "3. Test your deployed application" 