# Production Deployment Guide

## Quick Deploy Steps

### 1. Pull Latest Code
```bash
cd /var/www/blog-backend
git pull origin main  # or your branch name
```

### 2. Install Dependencies (if needed)
```bash
npm install
```

### 3. Build the Application
```bash
npm run build
```

### 4. Restart with PM2
```bash
pm2 restart blog-backend
# Or if not running:
pm2 start npm --name "blog-backend" -- run start:prod
```

### 5. Check Logs
```bash
pm2 logs blog-backend --lines 50
```

### 6. Verify Routes
```bash
# Test health endpoint
curl https://australiastorys.com/api/v1/auth/health

# Test Google OAuth test endpoint
curl https://australiastorys.com/api/v1/auth/google/test
```

## Full Deployment Script

Create a deployment script at `/var/www/blog-backend/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

cd /var/www/blog-backend

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting application..."
pm2 restart blog-backend || pm2 start npm --name "blog-backend" -- run start:prod

echo "⏳ Waiting for server to start..."
sleep 5

echo "✅ Checking server status..."
pm2 status blog-backend

echo "📋 Recent logs:"
pm2 logs blog-backend --lines 20 --nostream

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x /var/www/blog-backend/deploy.sh
```

Then run:
```bash
./deploy.sh
```

## Troubleshooting

### Route Still Returns 404

1. **Check if build was successful:**
   ```bash
   ls -la dist/
   ```
   Should see compiled JavaScript files.

2. **Check PM2 is running the correct process:**
   ```bash
   pm2 list
   pm2 describe blog-backend
   ```

3. **Check backend logs for route registration:**
   ```bash
   pm2 logs blog-backend | grep -i "google\|auth\|route"
   ```

4. **Verify environment variables:**
   ```bash
   cd /var/www/blog-backend
   cat .env | grep GOOGLE
   ```

5. **Test if any auth route works:**
   ```bash
   curl https://australiastorys.com/api/v1/auth/health
   ```

### Build Errors

If build fails:
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### PM2 Issues

If PM2 isn't working:
```bash
# Stop all processes
pm2 stop all

# Delete the process
pm2 delete blog-backend

# Start fresh
cd /var/www/blog-backend
pm2 start npm --name "blog-backend" -- run start:prod

# Save PM2 configuration
pm2 save
pm2 startup  # Follow instructions to enable on boot
```
