# Google Cloud Setup Guide

## Step 1: Sign in to Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Sign in with your Google account
3. Create a new project or select an existing one

## Step 2: Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - Compute Engine API
   - Cloud Resource Manager API
   - Service Usage API

## Step 3: Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `chrome-vm-service`
4. Description: `Service account for Chrome VM automation`
5. Click "Create and Continue"

## Step 4: Assign Roles
Assign these roles to the service account:
- Compute Instance Admin (v1)
- Service Account User
- Project Editor (for full access)

## Step 5: Create and Download Key
1. Click on the service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the key file

## Step 6: Get Project ID
1. Go to "Project Settings" (gear icon)
2. Copy the "Project ID" (not Project Number)

## Step 7: Configure Environment Variables
Set these in Cloudflare Workers:
- `GOOGLE_CLOUD_PROJECT_ID`: Your project ID
- `GOOGLE_CLOUD_ACCESS_TOKEN`: The JSON key content (base64 encoded)

## Step 8: Test Configuration
Run this command to test:
```bash
curl -X POST "https://pacific-blessing-production.up.railway.app/api/vms" \
  -H "Content-Type: application/json" \
  -d '{"name":"Google Cloud Real VM","server_id":"default-google-cloud-server","instanceType":"e2-medium"}'
```

## Expected Results
- VM should be created with `createdVia: "google-cloud-real"`
- Should have real GCP instance details
- Should be accessible via NoVNC interface

