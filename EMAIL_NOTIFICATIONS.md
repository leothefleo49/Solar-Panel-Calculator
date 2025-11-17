# Email Notification Setup for Solar Panel Calculator

## Overview
GitHub Actions automatically sends email digests after each workflow run to keep you updated on CI/CD status.

## Setup Instructions

### 1. Configure Email Address
Set your notification email as a repository secret:

```bash
# In GitHub: Settings → Secrets and variables → Actions → New repository secret
Name: NOTIFICATION_EMAIL
Value: your-email@example.com
```

### 2. Set Up Email Webhook (Optional but Recommended)

**Option A: Use your existing email control server**
```bash
# In tools/email-control-server/index.js
# Already configured to handle GitHub webhook format
```

Deploy to a service like:
- Railway.app (free tier)
- Render.com (free tier)
- Fly.io (free tier)
- Heroku (paid)

Then set the webhook URL:
```bash
Name: EMAIL_WEBHOOK_URL
Value: https://your-server.railway.app/webhook
```

**Option B: Use GitHub's built-in email service**
Without a webhook, notifications are logged in workflow output (you'll need to check Actions page).

### 3. Configure Notification Mode

Set repository variables (Settings → Secrets and variables → Actions → Variables):

**All builds (default):**
```bash
Name: EMAIL_NOTIFICATION_MODE
Value: all
```

**Failures only:**
```bash
Name: EMAIL_NOTIFICATION_MODE
Value: failures-only
```

**Disable completely:**
```bash
Name: EMAIL_NOTIFICATIONS
Value: disabled
```

### 4. Email Threading

Emails automatically thread using a consistent Message-ID:
```bash
Name: EMAIL_THREAD_ID
Value: solar-panel-ci
```

All CI emails reply to the same thread in your inbox.

## Quick Commands

### Disable Notifications
```bash
gh variable set EMAIL_NOTIFICATIONS --body "disabled" --repo leothefleo49/Solar-Panel-Calculator
```

### Enable Failures Only
```bash
gh variable set EMAIL_NOTIFICATION_MODE --body "failures-only" --repo leothefleo49/Solar-Panel-Calculator
```

### Enable All Builds
```bash
gh variable set EMAIL_NOTIFICATION_MODE --body "all" --repo leothefleo49/Solar-Panel-Calculator
```

### Re-enable Notifications
```bash
gh variable delete EMAIL_NOTIFICATIONS --repo leothefleo49/Solar-Panel-Calculator
```

## Email Format

**Subject:**
```
[✅] Solar Panel Calculator - CI - Build & Test
```

**Body:**
```
Workflow: CI - Build & Test
Status: Success ✅
Branch: main
Commit: 4bf97e9 - fix(ci): iOS workflow always exits success

View Details: https://github.com/leothefleo49/Solar-Panel-Calculator/actions/runs/...

---
Repository: leothefleo49/Solar-Panel-Calculator
Triggered by: leothefleo49
Time: 2025-11-17 18:30:45 UTC

💡 To change notification settings:
- Disable: Set EMAIL_NOTIFICATIONS variable to 'disabled'
- Failures only: Set EMAIL_NOTIFICATION_MODE to 'failures-only'
- All builds: Set EMAIL_NOTIFICATION_MODE to 'all' (default)
```

## Workflows That Trigger Emails

1. **CI - Build & Test** (on push to main/develop)
2. **Release Build Matrix** (on tag push)
3. **iOS Simulator Build on Push** (on push to main)
4. **Version Sync on Push** (on push to main)

## Troubleshooting

**Not receiving emails?**
1. Check workflow runs: Actions tab → "Email Notifications"
2. Verify secrets are set: Settings → Secrets and variables
3. Check spam folder
4. Test webhook URL manually:
   ```bash
   curl -X POST "YOUR_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"to":"your@email.com","subject":"Test","body":"Test message"}'
   ```

**Too many emails?**
```bash
gh variable set EMAIL_NOTIFICATION_MODE --body "failures-only" --repo leothefleo49/Solar-Panel-Calculator
```

**Emails not threading?**
- Ensure your email client supports In-Reply-To header
- Gmail/Outlook should thread automatically
- Check EMAIL_THREAD_ID variable is set

## Security Notes

- Email addresses stored as **secrets** (encrypted)
- Webhook URLs stored as **secrets** (encrypted)
- Configuration variables are **public** in repo settings
- Never commit email credentials to git
