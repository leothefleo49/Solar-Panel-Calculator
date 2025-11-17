# Client Error Reporter

Backend webhook server that receives error reports from the Solar Panel Calculator app and emails them to you.

## Features

- 📧 **Email Error Reports**: Automatically emails you when users encounter errors
- 🎨 **Beautiful Formatting**: HTML emails with color-coded sections
- 📊 **Grouped by Category**: Errors organized by type (API, UI, Network, etc.)
- 🔍 **Detailed Context**: Includes platform, app version, memory usage, API status
- 🚀 **Easy Deployment**: Deploy to Railway, Render, Fly.io, or run locally

## Quick Start

### 1. Install Dependencies

```bash
cd tools/client-error-reporter
npm install
```

### 2. Configure Email

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and add your Gmail App Password:

```env
EMAIL_USER=leothefleo49@gmail.com
EMAIL_APP_PASSWORD=your-16-char-app-password
RECIPIENT_EMAIL=leothefleo49@gmail.com
```

#### How to Get Gmail App Password:

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required)
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Other (Custom name)"
5. Name it "Solar Panel Error Reporter"
6. Click "Generate"
7. Copy the 16-character password (without spaces)
8. Paste it in `.env` as `EMAIL_APP_PASSWORD`

### 3. Test Locally

```bash
npm start
```

Server will run on `http://localhost:3001`

Test it:
```bash
curl -X POST http://localhost:3001/api/error-logs \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [
      {
        "type": "error",
        "category": "api",
        "message": "Test error",
        "timestamp": 1234567890,
        "context": {
          "platform": "desktop",
          "appVersion": "1.4.12",
          "screenResolution": "1920x1080",
          "apiKeysConfigured": {}
        }
      }
    ]
  }'
```

You should receive an email!

## Deploy to Railway (Recommended)

### Option 1: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/leothefleo49/Solar-Panel-Calculator)

### Option 2: Manual Deploy

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize project:
```bash
cd tools/client-error-reporter
railway init
```

4. Set environment variables:
```bash
railway variables set EMAIL_USER=leothefleo49@gmail.com
railway variables set EMAIL_APP_PASSWORD=your-16-char-app-password
railway variables set RECIPIENT_EMAIL=leothefleo49@gmail.com
```

5. Deploy:
```bash
railway up
```

6. Get your public URL:
```bash
railway domain
```

You'll get a URL like: `https://client-error-reporter-production.up.railway.app`

## Deploy to Render

1. Create account at https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: client-error-reporter
   - **Root Directory**: tools/client-error-reporter
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables:
   - `EMAIL_USER`
   - `EMAIL_APP_PASSWORD`
   - `RECIPIENT_EMAIL`
6. Click "Create Web Service"

You'll get a URL like: `https://client-error-reporter.onrender.com`

## Configure App to Use Webhook

Once deployed, update your app's environment variables:

### For Development (.env.local):
```env
VITE_ERROR_LOG_ENDPOINT=https://your-webhook-url.railway.app/api/error-logs
VITE_ERROR_LOG_EMAIL=leothefleo49@gmail.com
```

### For Production (Tauri):

Update `App/src-tauri/tauri.conf.json`:
```json
{
  "plugins": {
    "shell": {
      "env": {
        "VITE_ERROR_LOG_ENDPOINT": "https://your-webhook-url.railway.app/api/error-logs",
        "VITE_ERROR_LOG_EMAIL": "leothefleo49@gmail.com"
      }
    }
  }
}
```

Or set environment variables before building:
```bash
$env:VITE_ERROR_LOG_ENDPOINT="https://your-webhook-url.railway.app/api/error-logs"
$env:VITE_ERROR_LOG_EMAIL="leothefleo49@gmail.com"
npm run tauri:build
```

## API Endpoints

### POST /api/error-logs

Main endpoint for app error reports.

**Request Body:**
```json
{
  "to": "leothefleo49@gmail.com",
  "subject": "Solar Panel Calculator - Error Report",
  "body": "Custom email body (optional)",
  "logs": [
    {
      "id": "err-123",
      "timestamp": 1234567890,
      "type": "error",
      "category": "api",
      "message": "API request failed",
      "stack": "Error: ...",
      "context": {
        "platform": "desktop",
        "appVersion": "1.4.12",
        "userAgent": "...",
        "screenResolution": "1920x1080",
        "apiKeysConfigured": {...}
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "abc123",
  "logCount": 1
}
```

### POST /api/send-email

Simple endpoint for sending any email.

**Request Body:**
```json
{
  "to": "leothefleo49@gmail.com",
  "subject": "Test Email",
  "body": "Hello world"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "client-error-reporter",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Report Format

Emails are automatically formatted with:

- 📊 **Summary**: Total errors, warnings, and info messages
- 🗂️ **Grouped by Category**: API, UI, Network, System, Validation
- 🎯 **Detailed Info**: Platform, app version, user action, memory usage
- 🔍 **Stack Traces**: Full error stack traces
- 💡 **Debugging Advice**: Automatic suggestions based on error type
- 🛠️ **Suggested Fixes**: Actionable steps to resolve issues

Example email sections:

```
# Solar Panel Calculator - Client Error Report

**Generated:** January 1, 2024 at 10:00 AM
**Total Issues:** 3 (2 errors, 1 warning)

---

## API Issues (2)

### 🚨 1. Failed to fetch solar data

- **Type:** error
- **Time:** January 1, 2024 at 10:00 AM
- **Platform:** desktop
- **App Version:** 1.4.12
- **Screen:** 1920x1080
- **User Action:** Click "Calculate Solar Potential" button
- **APIs Configured:** unified, solar, gemini
- **Memory Usage:** 245.67MB / 512.00MB

**Stack Trace:**
```
Error: Failed to fetch
    at googleApis.ts:123
    at SolarApiIntegration.tsx:456
```

**Debugging Advice:**
- Check if the API key is valid and has proper permissions
- Verify that the API is enabled in the provider console
- Ensure network connectivity is stable

**Suggested Fixes:**
- Go to Settings > APIs tab and verify all keys are correctly configured
- Try regenerating API keys in the provider console
```

## Monitoring

View logs in Railway/Render dashboard:

- **Railway**: `railway logs`
- **Render**: View in web dashboard

## Security

- ✅ **App Passwords**: Uses Gmail App Passwords (not your account password)
- ✅ **Environment Variables**: Sensitive data stored in `.env` (not committed)
- ✅ **CORS Enabled**: Allows requests from your app
- ✅ **Request Validation**: Validates payload structure

## Troubleshooting

### Emails Not Sending

1. **Check Gmail App Password**:
   - Must be 16 characters (no spaces)
   - 2-Step Verification must be enabled
   - Generate new password at https://myaccount.google.com/apppasswords

2. **Check Environment Variables**:
   ```bash
   # Railway
   railway variables
   
   # Render
   # Check in dashboard Settings > Environment
   ```

3. **Check Server Logs**:
   ```bash
   # Railway
   railway logs
   
   # Local
   npm start
   ```

4. **Test Endpoint**:
   ```bash
   curl -X POST https://your-url.railway.app/health
   ```

### CORS Errors

If you see CORS errors in browser console, the webhook URL is correct but CORS is already enabled in the server.

### Invalid Payload Errors

Ensure your app is sending the correct format:
```javascript
{
  logs: [{
    type: 'error',
    category: 'api',
    message: 'Error message',
    timestamp: Date.now(),
    context: { ... }
  }]
}
```

## Alternative Email Services

To use other email services instead of Gmail:

### Outlook:
```env
EMAIL_USER=your-email@outlook.com
EMAIL_APP_PASSWORD=your-outlook-app-password
```

### Custom SMTP:
Edit `index.js`:
```javascript
const EMAIL_CONFIG = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
};
```

## Cost

- **Railway**: Free tier (500 hours/month, enough for 24/7)
- **Render**: Free tier (750 hours/month, spins down after inactivity)
- **Gmail**: Free (with App Password)

## License

MIT
