# Chrome VM Example Server

This is a ready-to-deploy Chrome VM server that you can use with the Chrome VM Dashboard.

## 🚀 Quick Deploy to Railway

1. **Fork this repository** or copy the files
2. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```
3. **Login to Railway:**
   ```bash
   railway login
   ```
4. **Deploy:**
   ```bash
   railway init
   railway up
   ```

## 🔧 Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   export NODE_ENV=production
   export VM_ID=your-unique-vm-id
   export PORT=3000
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## 📋 Environment Variables

- `NODE_ENV`: Set to `production` for cloud deployment
- `VM_ID`: Unique identifier for this VM instance
- `PORT`: Port to run the server on (default: 3000)

## 🔗 Adding to Dashboard

Once deployed, add this server to your Chrome VM Dashboard:

1. **Get your server URL** (e.g., `https://your-app.railway.app`)
2. **Click "Add Server" in the dashboard**
3. **Fill in the details:**
   - **Name**: `My Railway Server`
   - **Host**: `your-app.railway.app`
   - **Port**: `3000`
   - **NoVNC Port**: `6080` (not used in this example)
   - **Location**: `Railway Cloud`
   - **Max VMs**: `1`

## 🧪 Testing

Test your server:

```bash
# Health check
curl https://your-app.railway.app/health

# VM info
curl https://your-app.railway.app/info

# Execute script
curl -X POST https://your-app.railway.app/run \
  -H "Content-Type: application/json" \
  -d '{"job_id": "test", "script": "return document.title;"}'

# Navigate to Google
curl -X POST https://your-app.railway.app/browser/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.google.com"}'
```

## 🎯 Features

- ✅ Chrome browser automation
- ✅ Script execution
- ✅ Page navigation
- ✅ Screenshot capture
- ✅ Health monitoring
- ✅ Cloud-ready deployment

## 🔧 Customization

You can customize this server by:

1. **Modifying `server.js`** to add new endpoints
2. **Updating the Dockerfile** to install additional packages
3. **Adding environment variables** for configuration
4. **Implementing authentication** if needed

## 📊 Monitoring

The server provides these endpoints for monitoring:

- `GET /health` - Server health status
- `GET /info` - VM information
- `GET /` - Server overview

## 🚨 Troubleshooting

### Common Issues

1. **Chrome won't start:**
   - Check if all dependencies are installed
   - Verify the Dockerfile includes all required packages
   - Check server logs for error messages

2. **Scripts not executing:**
   - Ensure the browser is initialized
   - Check the `/health` endpoint
   - Verify the script syntax

3. **Deployment fails:**
   - Check Railway logs
   - Verify all files are present
   - Ensure environment variables are set

### Logs

Check your deployment logs:

```bash
# Railway
railway logs

# Or check the Railway dashboard
```

## 🎉 Success!

Once deployed and added to your dashboard, you can:

1. **Create VMs** on this server
2. **Execute scripts** remotely
3. **Navigate pages** programmatically
4. **Take screenshots** for monitoring
5. **Scale** by deploying multiple instances

Happy automating! 🚀
