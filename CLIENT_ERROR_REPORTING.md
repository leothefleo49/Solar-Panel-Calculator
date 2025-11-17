# Client Error Reporting Setup

Get automatic email notifications when users encounter errors in your Solar Panel Calculator app.

## 🎯 Key Features

- ✅ **Automatic Reporting**: Sends email immediately after every app close (beta mode)
- ✅ **Email Threading**: All reports in one email conversation thread
- ✅ **Reply-Based Control**: Change settings by replying to emails with commands
- ✅ **Persistent Config**: Settings survive app updates
- ✅ **One Email Thread**: All error reports grouped in your inbox
- ✅ **Comprehensive Errors**: API failures, UI issues, network problems, warnings

## Overview

The app already has comprehensive error logging built in (`App/src/utils/errorLogger.ts`). It captures:

- 🚨 **API Errors**: Failed requests, CORS issues, rate limits, authentication failures
- 🎨 **UI Errors**: Component crashes, rendering issues, color problems, flickers
- 🌐 **Network Errors**: Connection failures, timeouts
- ⚠️ **Warnings**: Non-critical issues that need attention
- 📊 **Context**: Platform, app version, memory usage, API status, user actions

All errors are automatically logged with:
- Full stack traces
- User action that triggered the error
- System information (platform, memory, screen resolution)
- API configuration status (which APIs are configured)
- Automatic debugging advice
- Suggested fixes

## Quick Setup (5 minutes)

### Step 1: Deploy Error Reporter Webhook

Choose one option:

#### Option A: Railway (Recommended)

```bash
cd tools/client-error-reporter
npm install

# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway variables set EMAIL_USER=leothefleo49@gmail.com
railway variables set EMAIL_APP_PASSWORD=your-gmail-app-password
railway variables set RECIPIENT_EMAIL=leothefleo49@gmail.com
railway up

# Get your webhook URL
railway domain
```

#### Option B: Render

1. Go to https://render.com
2. Create account and link GitHub
3. Click "New +" → "Web Service"
4. Configure:
   - **Root Directory**: `tools/client-error-reporter`
   - **Build**: `npm install`
   - **Start**: `npm start`
5. Add environment variables:
   - `EMAIL_USER=leothefleo49@gmail.com`
   - `EMAIL_APP_PASSWORD=your-gmail-app-password`
   - `RECIPIENT_EMAIL=leothefleo49@gmail.com`

#### Option C: Local Testing

```bash
cd tools/client-error-reporter
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Gmail credentials

npm start
```

Use `ngrok` to expose local server:
```bash
ngrok http 3001
```

### Step 2: Get Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required)
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" → "Other (Custom name)"
5. Name: "Solar Panel Error Reporter"
6. Click "Generate"
7. Copy the 16-character password (example: `abcd efgh ijkl mnop`)
8. Remove spaces: `abcdefghijklmnop`

### Step 3: Configure App

Update `App/.env` (create if it doesn't exist):

```env
# Your deployed webhook URL from Step 1
VITE_ERROR_LOG_ENDPOINT=https://your-app.railway.app/api/error-logs

# Your email address (where reports are sent)
VITE_ERROR_LOG_EMAIL=leothefleo49@gmail.com

# Optional: Remote config URL for email-based mode control
VITE_ERROR_LOG_CONFIG_URL=https://your-app.railway.app/api/config/default
```

### Step 4: Test It

Run your app:

```bash
cd App
npm run dev
```

**Open the app, then close it.** You should receive an email within seconds! 📧

The email will be the first in a new **threaded conversation**. All future reports will appear in the same thread.

## What You'll Receive

Every time you close the app, you'll get an email in **one threaded conversation**:

```
Subject: Solar Panel Calculator - Session Report (3 issues)

# Solar Panel Calculator - Client Error Report

**Generated:** January 1, 2024 at 10:00 AM
**Total Issues:** 3 (2 errors, 1 warning)

---

## API Issues (2)

### 🚨 1. Google Solar API request failed
[... full error details ...]

---

Reply with one of the following commands to change the reporting interval:
- mode: every_run
- mode: hourly
- mode: daily
- mode: weekly
- mode: biweekly  
- mode: monthly
```

### Changing Settings via Email Reply

Just reply to any error report email with:

```
mode: daily
```

You'll get a confirmation:
```
Subject: Solar Panel Calculator - Config Updated

Your error reporting interval has been updated to: daily

Current settings:
- Interval: daily

Reply with another command to change it again.
```

All future reports will respect your new setting, **even after app updates**!

## Error Reporting Modes

The error logger has two modes:

### Beta Mode (Current Default) ✅
- **Behavior**: Sends email immediately after each app close
- **Use Case**: Testing, want instant notifications when you close the app
- **Config**: Automatically set
- **Email Threading**: All reports in one conversation

### Custom Intervals
Reply to any error email with:
- `mode: every_run` - After every app close (default)
- `mode: hourly` - Once per hour (batched)
- `mode: daily` - Once per day at 2 AM
- `mode: weekly` - Every Monday at 2 AM
- `mode: biweekly` - Every other Monday
- `mode: monthly` - First Monday of each month
- `mode: disabled` - Stop all reports

**Your settings persist across app updates!** They're stored remotely on the webhook server and synced automatically.

## Remote Control (Optional)

You can control error reporting remotely without app updates:

### Step 1: Deploy Config Server

Create a simple JSON endpoint:

```json
{
  "reportingInterval": "daily"
}
```

Options: `every_run`, `hourly`, `daily`, `weekly`, `biweekly`, `monthly`, `disabled`

### Step 2: Configure App

```env
VITE_ERROR_LOG_CONFIG_URL=https://your-config-server.com/config.json
```

The app will check every 5 minutes and adjust reporting interval automatically.

## Error Categories

The system automatically categorizes errors:

| Category | Examples |
|----------|----------|
| **API** | Failed requests, CORS, authentication, rate limits |
| **UI** | Component crashes, rendering errors, CSS issues |
| **Network** | Connection failures, timeouts, offline |
| **System** | Out of memory, platform-specific errors |
| **Validation** | Invalid input, missing required fields |
| **Unknown** | Uncategorized errors |

## Already Integrated

The error logger is already integrated in:

- ✅ **API Validator** (`apiValidator.ts`): Captures all API errors
- ✅ **Quota Tracker** (`quotaTracker.ts`): Logs quota warnings
- ✅ **Global Error Handler**: Catches unhandled errors and promise rejections
- ✅ **React Error Boundaries**: Can be added to catch React errors

To add more error tracking, use:

```typescript
import { logError, logWarning, logInfo } from './utils/errorLogger';

// In your component
try {
  await someRiskyOperation();
} catch (error) {
  await logError(
    'Failed to perform operation',
    error instanceof Error ? error : undefined,
    'ui', // category
    'Click save button' // user action
  );
}
```

## View Logs in App

Users can view their own error logs:

```typescript
import { errorLogger } from './utils/errorLogger';

// Get all logs
const allLogs = errorLogger.getLogs();

// Filter by type
const errors = errorLogger.getLogs({ type: 'error' });

// Filter by category
const apiErrors = errorLogger.getLogs({ category: 'api' });

// Export as JSON
const json = errorLogger.exportLogs();

// Export as CSV
const csv = errorLogger.exportLogsAsCSV();
```

You can add a debug panel in your app to show this info.

## Cost

- **Railway**: Free tier (500 hours/month = 24/7 operation)
- **Render**: Free tier (750 hours/month, spins down after inactivity)
- **Gmail**: Free (unlimited app passwords)
- **Total**: $0/month 💰

## Privacy

- ✅ **No API Keys Logged**: Only logs which keys are configured (true/false)
- ✅ **No Personal Data**: Doesn't log user addresses or sensitive info
- ✅ **Local Storage**: Errors stored in browser localStorage
- ✅ **Opt-in**: Users can disable error reporting (add setting in app)

## Troubleshooting

### Not Receiving Emails?

1. **Check webhook URL**:
   ```bash
   curl https://your-url.railway.app/health
   ```
   Should return: `{"status":"ok"}`

2. **Check Gmail App Password**:
   - Must be 16 characters
   - No spaces
   - 2-Step Verification enabled

3. **Check environment variables**:
   ```bash
   # Railway
   railway variables
   ```

4. **Check server logs**:
   ```bash
   # Railway
   railway logs
   ```

5. **Test endpoint directly**:
   ```bash
   curl -X POST https://your-url.railway.app/api/error-logs \
     -H "Content-Type: application/json" \
     -d '{"logs":[{"type":"error","category":"test","message":"Test","timestamp":123,"context":{"platform":"test","appVersion":"1.0","screenResolution":"1920x1080","apiKeysConfigured":{}}}]}'
   ```

### Emails Going to Spam?

- Add your webhook domain to "Safe Senders"
- Check Gmail filters
- Verify sender address matches your Gmail account

### Too Many Emails?

Switch to production mode or adjust interval:

```typescript
// In errorLogger.ts
mode: 'production',
reportingInterval: 'weekly', // or 'daily', 'monthly'
```

## Advanced: Custom Error Handling

Add React Error Boundary:

```typescript
import React from 'react';
import { logError } from './utils/errorLogger';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(
      `React component error: ${error.message}`,
      error,
      'ui',
      'Component render/lifecycle'
    );
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

// Wrap your app
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Next Steps

1. ✅ Deploy webhook server
2. ✅ Configure Gmail App Password
3. ✅ Set environment variables in app
4. ✅ Test with sample error
5. 📧 Receive your first error report!
6. 🚀 Deploy app to users and monitor errors

Now you'll know immediately when users encounter issues! 🎉
