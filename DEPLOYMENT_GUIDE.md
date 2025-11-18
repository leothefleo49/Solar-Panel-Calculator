# 🚀 Deployment Guide for Error Reporting & Auto-Updates

This guide helps you deploy the error reporting webhook and configure automatic updates for your Solar Panel Calculator app.

## Prerequisites

- GitHub account (you already have this!)
- Gmail account for sending error reports (or other email provider)
- Railway account (free tier) OR Render account (free tier)

## Part 1: Deploy Error Reporter Webhook (10 minutes)

The error reporter receives error logs from your app and emails them to you.

### Option A: Deploy to Railway (Recommended - Easiest)

1. **Create Railway Account**
   - Go to https://railway.app
   - Click "Login with GitHub"
   - Authorize Railway to access your GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `Solar-Panel-Calculator` repository
   - Select "tools/client-error-reporter" as the root directory

3. **Configure Environment Variables**
   - In your Railway project, click on the service
   - Go to "Variables" tab
   - Add these variables:
     ```
     EMAIL_USER=leothefleo49@gmail.com
     EMAIL_APP_PASSWORD=your-gmail-app-password
     RECIPIENT_EMAIL=leothefleo49@gmail.com
     PORT=3001
     ```

4. **Get Gmail App Password**
   - Go to https://myaccount.google.com/security
   - Enable **2-Step Verification** (required)
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)"
   - Name it "Solar Panel Error Reporter"
   - Click "Generate"
   - Copy the 16-character password (remove spaces)
   - Use this as `EMAIL_APP_PASSWORD` in Railway

5. **Deploy**
   - Railway will automatically deploy your app
   - Wait for deployment to complete (~2 minutes)
   - Click "Settings" → "Generate Domain" to get your public URL
   - Your URL will look like: `https://solar-error-reporter-production-xxxx.up.railway.app`

6. **Test the Endpoint**
   ```powershell
   curl https://your-railway-url.up.railway.app/health
   ```
   Should return: `{"status":"ok","service":"client-error-reporter",...}`

### Option B: Deploy to Render (Alternative)

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `solar-error-reporter`
     - **Root Directory**: `tools/client-error-reporter`
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Add Environment Variables**
   - In the dashboard, go to "Environment"
   - Add the same variables as Railway (see above)

4. **Deploy**
   - Render will auto-deploy
   - Your URL: `https://solar-error-reporter.onrender.com`

### Option C: Deploy to Your Own Server

If you have your own VPS or server:

```bash
# SSH into your server
ssh user@yourserver.com

# Clone the repo
git clone https://github.com/leothefleo49/Solar-Panel-Calculator.git
cd Solar-Panel-Calculator/tools/client-error-reporter

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
EMAIL_USER=leothefleo49@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
RECIPIENT_EMAIL=leothefleo49@gmail.com
PORT=3001
EOF

# Install PM2 for process management
npm install -g pm2

# Start the service
pm2 start index.js --name solar-error-reporter
pm2 save
pm2 startup

# Set up nginx reverse proxy (optional)
# Point domain to this service on port 3001
```

## Part 2: Configure GitHub Secrets (5 minutes)

Now that your webhook is deployed, add it to GitHub so release builds use it automatically.

1. **Go to Your GitHub Repository**
   - https://github.com/leothefleo49/Solar-Panel-Calculator

2. **Navigate to Settings → Secrets and Variables → Actions**

3. **Add Repository Secret**
   - Click "New repository secret"
   - Name: `ERROR_LOG_ENDPOINT`
   - Value: Your deployed webhook URL + `/api/error-logs`
   - Example: `https://solar-error-reporter-production-xxxx.up.railway.app/api/error-logs`
   - Click "Add secret"

4. **Verify Configuration**
   - The release workflow will now inject this URL into all builds
   - Users who download releases will automatically send error reports to your webhook

## Part 3: Update Local Development (2 minutes)

Update your local `.env` file to use the deployed endpoint:

```bash
cd App
```

Edit `App/.env`:
```env
VITE_ERROR_LOG_ENDPOINT=https://your-railway-url.up.railway.app/api/error-logs
VITE_ERROR_LOG_EMAIL=leothefleo49@gmail.com
```

## Part 4: Test Error Reporting (5 minutes)

### Test Locally

1. **Start your local app:**
   ```powershell
   cd App
   npm run dev
   ```

2. **Open the app and close it**
   - The app should send a session report to your email
   - Check your inbox (leothefleo49@gmail.com)
   - You should receive an email within 30 seconds

3. **Check the webhook logs:**
   - Railway: Click your service → "Deployments" → "View Logs"
   - Render: Click your service → "Logs"
   - You should see: `✅ Email sent: <messageId>`

### Test Production Build

1. **Build the app:**
   ```powershell
   cd App
   npm run tauri:build
   ```

2. **Install the built app** (from `App/src-tauri/target/release/bundle/`)

3. **Open and close the app**
   - Should send error report email
   - Verify you received it

## Part 5: Configure Auto-Updates (Already Done!)

The auto-update system is already configured in your repository. Here's how it works:

### How Auto-Updates Work

1. **When you create a release** (by pushing a git tag like `v1.4.13`):
   - GitHub Actions builds all platform versions
   - Creates `latest.json` with version info and download URLs
   - Uploads everything to the GitHub Release

2. **When users open the app**:
   - Desktop: Tauri's updater checks `latest.json` every hour
   - Android: Custom updater checks GitHub API
   - Compares current version with latest version
   - Shows notification if update available

3. **When users click "Install & Restart"**:
   - Desktop: Auto-downloads and installs update
   - Android: Opens browser to download new APK

### Updater Configuration

The updater is configured in `App/src-tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": ""
    }
  }
}
```

**Note:** The `pubkey` field is empty, meaning updates are not cryptographically signed. For production, you should:

1. Generate a signing keypair:
   ```powershell
   cargo install tauri-cli
   cargo tauri signer generate -w ~/.tauri/myapp.key
   ```

2. Add the public key to `tauri.conf.json`

3. Add the private key to GitHub Secrets:
   - Name: `TAURI_PRIVATE_KEY`
   - Value: Contents of `~/.tauri/myapp.key`

4. Update release workflow to sign builds (already commented out in the workflow)

## Part 6: Create a Release (5 minutes)

Now that everything is set up, create a new release:

1. **Bump the version** in 3 files:
   - `App/package.json`
   - `App/src-tauri/tauri.conf.json`
   - `App/src-tauri/Cargo.toml`

2. **Commit and push:**
   ```powershell
   git add .
   git commit -m "chore: bump version to 1.4.13"
   git push origin main
   ```

3. **Create and push the tag:**
   ```powershell
   git tag v1.4.13
   git push origin v1.4.13
   ```

4. **Monitor the build:**
   - Go to GitHub Actions: https://github.com/leothefleo49/Solar-Panel-Calculator/actions
   - Watch "Release Build Matrix" workflow
   - Wait 20-30 minutes for all platforms to build

5. **Verify the release:**
   - Go to https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest
   - Should see all installers: Windows, macOS, Linux, Android
   - Should see `latest.json` file (for auto-updates)

## Part 7: Verify Everything Works (10 minutes)

### Test Error Reporting on Released App

1. Download the release installer for your platform
2. Install the app
3. Open and close the app
4. Check your email - should receive error report within 60 seconds

### Test Auto-Updates

1. Keep the installed app (e.g., v1.4.13)
2. Create another release (e.g., v1.4.14)
3. Open the v1.4.13 app
4. Wait up to 60 seconds
5. Should see update notification
6. Click "Install & Restart"
7. App should update to v1.4.14

## Troubleshooting

### Not Receiving Error Emails

**Check webhook deployment:**
```powershell
curl https://your-webhook-url/health
```
Should return `{"status":"ok"}`

**Check webhook logs:**
- Railway: Service → Deployments → View Logs
- Render: Service → Logs

**Verify environment variables:**
- Make sure `EMAIL_APP_PASSWORD` is set correctly
- Make sure it's a Gmail App Password (16 characters), not your regular password

**Test the endpoint directly:**
```powershell
curl -X POST https://your-webhook-url/api/error-logs `
  -H "Content-Type: application/json" `
  -d '{"logs":[{"type":"error","category":"test","message":"Test","timestamp":123,"context":{"platform":"test","appVersion":"1.0","screenResolution":"1920x1080","apiKeysConfigured":{}}}]}'
```

### Auto-Updates Not Working

**Check `latest.json` exists:**
```powershell
curl https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest/download/latest.json
```

**Check app version:**
- Open app → Help → About
- Version should match your expectations

**Check console logs:**
- Open DevTools (Ctrl+Shift+I)
- Look for update-related messages

**Verify updater is enabled:**
- Check `App/src-tauri/tauri.conf.json`
- `"active": true` in plugins.updater

### Railway/Render Deployment Issues

**Logs show errors:**
- Check that all environment variables are set
- Verify the Gmail App Password is correct (no spaces)

**Service keeps restarting:**
- Check logs for startup errors
- Verify Node.js version compatibility (should use Node 18+)

**Domain not working:**
- Wait a few minutes after generating domain
- Railway/Render need time to provision SSL certificates

## Cost Estimate

- **Railway Free Tier**: $0/month (500 hours = 24/7 for small apps)
- **Render Free Tier**: $0/month (spins down after inactivity)
- **GitHub Actions**: Free for public repositories
- **Gmail**: Free (unlimited app passwords)
- **Total**: $0/month for free tiers

## Security Best Practices

1. ✅ **Never commit `.env` files** - Already in `.gitignore`
2. ✅ **Use GitHub Secrets** - For sensitive webhook URLs
3. ✅ **Use Gmail App Passwords** - Never use your actual Gmail password
4. ✅ **Rotate credentials periodically** - Change app passwords every 6 months
5. 🔄 **Sign your updates** (optional) - Add Tauri signing keys for production

## Next Steps

- ✅ Error reporting deployed and working
- ✅ Auto-updates configured and tested
- ✅ Release pipeline automated
- 🎉 **You're done!** Now anyone can download and use your app with automatic updates and error reporting.

## Summary

You now have:
1. ✅ Automated error reporting via email
2. ✅ Error reports sent when users close the app
3. ✅ Automatic updates for desktop and mobile
4. ✅ Automated release builds for all platforms
5. ✅ Secure credential management
6. ✅ $0/month infrastructure cost

**All users who download your app will automatically send error logs and receive automatic updates!** 🚀
