#!/bin/bash

# Google Cloud Setup Script for Chrome VM
echo "🚀 Setting up Google Cloud for Chrome VM..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Authenticate with Google Cloud
echo "🔐 Authenticating with Google Cloud..."
gcloud auth login

# Create a new project (or use existing)
echo "📁 Creating/selecting project..."
PROJECT_ID="chrome-vm-$(date +%s)"
gcloud projects create $PROJECT_ID --name="Chrome VM Project"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling required APIs..."
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable serviceusage.googleapis.com

# Create service account
echo "👤 Creating service account..."
gcloud iam service-accounts create chrome-vm-service \
    --display-name="Chrome VM Service Account" \
    --description="Service account for Chrome VM automation"

# Assign roles
echo "🔑 Assigning roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:chrome-vm-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/compute.instanceAdmin.v1"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:chrome-vm-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Create and download key
echo "🔐 Creating service account key..."
gcloud iam service-accounts keys create chrome-vm-key.json \
    --iam-account=chrome-vm-service@$PROJECT_ID.iam.gserviceaccount.com

# Display the credentials
echo "✅ Setup complete!"
echo "📋 Project ID: $PROJECT_ID"
echo "🔑 Service account key saved to: chrome-vm-key.json"
echo ""
echo "Next steps:"
echo "1. Copy the Project ID: $PROJECT_ID"
echo "2. Copy the contents of chrome-vm-key.json"
echo "3. Set these as secrets in Cloudflare Workers:"
echo "   - GOOGLE_CLOUD_PROJECT_ID: $PROJECT_ID"
echo "   - GOOGLE_CLOUD_ACCESS_TOKEN: (contents of chrome-vm-key.json)"
