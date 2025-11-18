# 📧 Client Error Reporter

Webhook server that receives error reports from the Solar Panel Calculator app and emails them to you.

## Features

- ✅ Receives error logs via HTTP POST
- ✅ Sends formatted email reports
- ✅ Email threading (all reports in one conversation)
- ✅ Reply-based mode control (change settings via email)
- ✅ Remote config endpoint for dynamic settings
- ✅ Health check endpoint
- ✅ Express.js + Nodemailer
- ✅ Free tier compatible (Railway, Render)

## Quick Deploy

### Railway (Recommended)

1. Go to https://railway.app
2. Login with GitHub
3. New Project → "Deploy from GitHub repo"
4. Select this repository
5. Root directory: `tools/client-error-reporter`
6. Add environment variables:
   - `EMAIL_USER=your-email@gmail.com`
   - `EMAIL_APP_PASSWORD=your-gmail-app-password`
   - `RECIPIENT_EMAIL=your-email@gmail.com`
7. Deploy!
8. Generate domain to get your webhook URL

### Render

1. Go to https://render.com
2. New Web Service
3. Connect your GitHub repo
4. Configure:
   - Root: `tools/client-error-reporter`
   - Build: `npm install`
   - Start: `npm start`
5. Add environment variables (same as above)
6. Deploy!

### Local Testing

```bash
cd tools/client-error-reporter
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

npm start
```

Use ngrok to expose locally:
```bash
ngrok http 3001
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_USER` | Yes | Your Gmail address |
| `EMAIL_APP_PASSWORD` | Yes | Gmail App Password (16 chars) |
| `RECIPIENT_EMAIL` | No | Where to send reports (defaults to EMAIL_USER) |
| `PORT` | No | Server port (default: 3001) |

## Getting Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" → "Other (Custom name)"
5. Name: "Solar Panel Error Reporter"
6. Click "Generate"
7. Copy the 16-character password (remove spaces)

## API Endpoints

### POST `/api/error-logs`

Receives error logs and sends email report.

**Request:**
```json
{
  "to": "recipient@example.com",
  "subject": "Solar Panel Calculator - Error Report (3 issues)",
  "body": "Optional custom body",
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
        "screenResolution": "1920x1080",
        "apiKeysConfigured": {...}
      },
      "debuggingAdvice": ["Check API key"],
      "suggestedFixes": ["Regenerate key"]
    }
  ],
  "threadId": "email-thread-123"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "<message-id@gmail.com>",
  "logCount": 3,
  "threadId": "email-thread-123"
}
```

### POST `/api/send-email`

Send simple text email.

**Request:**
```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "body": "Email body text"
}
```

### GET `/api/config/:userId`

Get reporting interval config for a user.

**Response:**
```json
{
  "reportingInterval": "daily"
}
```

### POST `/api/config/:userId`

Update reporting interval for a user.

**Request:**
```json
{
  "reportingInterval": "weekly"
}
```

**Valid intervals:** `every_run`, `hourly`, `daily`, `weekly`, `biweekly`, `monthly`, `disabled`

### POST `/api/email-reply`

Process email replies to change settings.

**Request:**
```json
{
  "subject": "Re: Error Report",
  "body": "mode: daily",
  "from": "user@example.com"
}
```

Parses email for commands like `mode: daily` or `interval: weekly`.

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "client-error-reporter",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Email Features

### Threading

All error reports are grouped in a single email thread using the `In-Reply-To` and `References` headers.

### Reply-Based Control

Users can reply to any error email with commands:
- `mode: every_run`
- `mode: hourly`
- `mode: daily`
- `mode: weekly`
- `mode: biweekly`
- `mode: monthly`
- `mode: disabled`

The server will update the config and send a confirmation email.

### Email Format

Error reports are sent in both plain text and HTML formats with:
- Summary (total issues, errors, warnings)
- Grouped by category (API, UI, Network, etc.)
- Full details for each error
- Stack traces
- Debugging advice
- Suggested fixes

## Testing

### Test Health Endpoint

```bash
curl https://your-url.railway.app/health
```

### Test Error Report

```bash
curl -X POST https://your-url.railway.app/api/error-logs \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [{
      "id": "test-1",
      "timestamp": 1234567890,
      "type": "error",
      "category": "test",
      "message": "Test error",
      "context": {
        "platform": "test",
        "appVersion": "1.0.0",
        "screenResolution": "1920x1080",
        "apiKeysConfigured": {}
      },
      "debuggingAdvice": [],
      "suggestedFixes": []
    }]
  }'
```

### Test Email

```bash
curl -X POST https://your-url.railway.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Email",
    "body": "This is a test email from the error reporter"
  }'
```

## Monitoring

### Railway

View logs:
1. Go to your Railway project
2. Click on the service
3. Go to "Deployments"
4. Click "View Logs"

### Render

View logs:
1. Go to your Render dashboard
2. Click on the service
3. Click "Logs" tab

## Troubleshooting

### Emails Not Sending

**Check Gmail settings:**
- 2-Step Verification enabled
- App Password is 16 characters (no spaces)
- Using App Password, not regular password

**Check environment variables:**
```bash
# Railway
railway variables

# Render
# Check dashboard → Environment
```

**Check logs:**
Look for error messages in the deployment logs.

### Service Crashes

**Out of Memory:**
- Railway/Render free tiers have memory limits
- The app is lightweight and shouldn't exceed limits
- Check logs for memory errors

**Port binding issues:**
- Make sure `PORT` environment variable is set
- Railway/Render automatically set this

### Email Goes to Spam

- Add sender address to contacts
- Mark first email as "Not Spam"
- Gmail should learn and deliver future emails to inbox

## Cost

- **Railway Free Tier**: 500 hours/month (~24/7 for small apps)
- **Render Free Tier**: 750 hours/month (spins down after inactivity)
- **Total**: $0/month on free tiers

## Security

- ✅ Never commit `.env` files (in `.gitignore`)
- ✅ Use Gmail App Passwords (not regular passwords)
- ✅ Store secrets in environment variables
- ✅ No API keys or sensitive data logged
- ✅ HTTPS only (enforced by Railway/Render)

## Integration

To use this webhook in your Solar Panel Calculator app:

1. Deploy this service
2. Get the webhook URL
3. Add to GitHub Secrets:
   - Name: `ERROR_LOG_ENDPOINT`
   - Value: `https://your-url.railway.app/api/error-logs`
4. Release builds will automatically use this endpoint

Or for local development:

```env
# App/.env
VITE_ERROR_LOG_ENDPOINT=https://your-url.railway.app/api/error-logs
VITE_ERROR_LOG_EMAIL=your-email@gmail.com
```

## License

MIT
