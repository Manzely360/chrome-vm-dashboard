# Chrome VM Dashboard - Cloud Deployment Guide

This guide will help you deploy the Chrome VM Dashboard to the cloud with 2 VMs running on Railway.

## Architecture

- **Frontend**: Vercel (Next.js)
- **Backend API**: Railway (Express.js)
- **VM Servers**: Railway (2 separate instances)

## Prerequisites

1. GitHub account
2. Railway account (free tier)
3. Vercel account (free tier)

## Step 1: Deploy Backend to Railway

1. Go to [Railway](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select your repository and choose the `railway-backend` folder
5. Railway will automatically detect the Node.js app and deploy it
6. Note the generated URL (e.g., `https://chrome-vm-backend-production.up.railway.app`)

## Step 2: Deploy VM Servers to Railway

### VM Server 1
1. Create a new Railway project
2. Deploy from GitHub repo, select the `railway-vm-server` folder
3. Add environment variable: `VM_ID=vm-server-1`
4. Note the generated URL (e.g., `https://chrome-vm-server-1-production.up.railway.app`)

### VM Server 2
1. Create another Railway project
2. Deploy from GitHub repo, select the `railway-vm-server` folder
3. Add environment variable: `VM_ID=vm-server-2`
4. Note the generated URL (e.g., `https://chrome-vm-server-2-production.up.railway.app`)

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project" → "Import Git Repository"
3. Select your repository and choose the `vercel-frontend` folder
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL
5. Deploy

## Step 4: Configure Servers

1. Open your deployed frontend
2. Go to the "Servers" tab
3. Click "Add Server" and add both VM servers:
   - **Server 1**: 
     - Name: "Cloud VM Server 1 (Recommended)"
     - Host: `chrome-vm-server-1-production.up.railway.app`
     - Port: `443` (HTTPS)
   - **Server 2**:
     - Name: "Cloud VM Server 2"
     - Host: `chrome-vm-server-2-production.up.railway.app`
     - Port: `443` (HTTPS)

## Step 5: Test the System

1. Create 2 VMs using the "Add VM" button
2. Each VM will be assigned to one of the cloud servers
3. Click "Click to control" to open the VM interface
4. Test script execution and browser automation

## Environment Variables

### Backend (Railway)
- `NODE_ENV=production`
- `FRONTEND_URL=https://your-vercel-app.vercel.app`

### VM Servers (Railway)
- `NODE_ENV=production`
- `VM_ID=vm-server-1` (or `vm-server-2`)

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL=https://chrome-vm-backend-production.up.railway.app`

## Features

✅ **Cloud-hosted VMs**: No local Docker required
✅ **Auto-scaling**: VMs run on Railway's infrastructure
✅ **Real browser automation**: Puppeteer with Chrome
✅ **Script execution**: Run JavaScript in browsers
✅ **Screenshot capture**: Take screenshots of pages
✅ **Multi-VM support**: Manage multiple VMs simultaneously
✅ **Server management**: Add/remove VM servers
✅ **Health monitoring**: Check server and VM status

## Troubleshooting

### VM Creation Fails
- Check that VM servers are running and healthy
- Verify server URLs are correct
- Check Railway logs for errors

### Scripts Don't Execute
- Ensure the VM is in "ready" status
- Check browser initialization in VM server logs
- Verify Puppeteer is working correctly

### Frontend Can't Connect
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend
- Ensure all services are deployed and running

## Cost

- **Railway**: Free tier includes 500 hours/month
- **Vercel**: Free tier includes 100GB bandwidth/month
- **Total**: Completely free for development and testing

## Scaling

To add more VMs:
1. Deploy additional VM servers to Railway
2. Add them as servers in the dashboard
3. Create VMs and they'll be distributed across available servers

## Security

- All communication uses HTTPS
- CORS is properly configured
- No sensitive data is stored in logs
- VMs are isolated in separate containers

## Support

If you encounter issues:
1. Check Railway logs for backend/VM server errors
2. Check Vercel logs for frontend errors
3. Verify all environment variables are set correctly
4. Ensure all services are healthy and responding
