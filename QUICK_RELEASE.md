# Quick Release Guide

## 🚀 First-Time Setup (One-Time Only)

Before your first release, you need to deploy the error reporting webhook:

### Step 0: Deploy Error Reporter (10 minutes)

1. **Deploy to Railway** (free tier):
   - Go to https://railway.app and login with GitHub
   - Create new project → "Deploy from GitHub repo"
   - Select your repository → Root: `tools/client-error-reporter`
   - Add environment variables:
     - `EMAIL_USER=leothefleo49@gmail.com`
     - `EMAIL_APP_PASSWORD=your-gmail-app-password` (see below)
     - `RECIPIENT_EMAIL=leothefleo49@gmail.com`
   - Generate domain → Copy the URL

2. **Get Gmail App Password**:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Go to https://myaccount.google.com/apppasswords
   - Create "Solar Panel Error Reporter" → Copy password (remove spaces)

3. **Add to GitHub Secrets**:
   - Go to your repo → Settings → Secrets → Actions
   - New secret: `ERROR_LOG_ENDPOINT`
   - Value: `https://your-railway-url.railway.app/api/error-logs`

✅ **Done!** This only needs to be done once. Future releases will automatically use this.

📖 **Detailed guide**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## Release Checklist

Follow these steps to release a new version:

### 1. Update Version Numbers

Update version in these 3 files:

- [ ] `App/package.json` → `"version": "1.4.28"`
- [ ] `App/src-tauri/tauri.conf.json` → `"version": "1.4.28"`
- [ ] `App/src-tauri/Cargo.toml` → `version = "1.4.28"`

### 2. Commit and Tag

```powershell
# Stage changes
git add .

# Commit version bump
git commit -m "chore: bump version to 1.4.28"

# Push to main
git push origin main

# Create tag
git tag v1.4.28

# Push tag (this triggers the release build)
git push origin v1.4.28
```

### 3. Monitor Build

1. Go to: https://github.com/leothefleo49/Solar-Panel-Calculator/actions
2. Watch "Release Build Matrix" workflow
3. Wait ~20-30 minutes for completion

### 4. Verify Release

Check: https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest

Ensure these files are present:
- [ ] Solar-Panel-Calculator-Windows.msi
- [ ] Solar-Panel-Calculator-Windows.exe
- [ ] Solar-Panel-Calculator-macOS.dmg
- [ ] Solar-Panel-Calculator-Linux.deb
- [ ] Solar-Panel-Calculator-Linux.AppImage
- [ ] Solar-Panel-Calculator-Android-Unsigned.apk (or signed)
- [ ] latest.json (update manifest for auto-updates)
- [ ] SHA256SUMS.txt

### 5. Test Auto-Update

1. Install the previous version on a test device
2. Open the app
3. Wait for update notification (or check immediately)
4. Click "Install & Restart" (desktop) or "Download Update" (Android)
5. Verify the update installs correctly

### 6. Test Error Reporting

1. Download and install the new release
2. Open the app
3. Close the app
4. Check your email (leothefleo49@gmail.com) within 60 seconds
5. Should receive error/session report

## What Users Get

When users download your release, they automatically get:

- ✅ **Error reporting**: Sends logs when app closes (all platforms)
- ✅ **Auto-updates**: Desktop checks hourly, shows notification
- ✅ **No setup needed**: Everything works out of the box
- ✅ **Privacy-focused**: No personal data logged

## Version Numbering

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.x.x): Breaking changes, major new features
- **MINOR** (x.4.x): New features, non-breaking changes
- **PATCH** (x.x.13): Bug fixes, small improvements

Examples:
- `1.4.28` → `1.4.28` (bug fix)
- `1.4.28` → `1.4.28` (new feature)
- `1.4.28` → `2.0.0` (breaking change)

## Troubleshooting

### Build Fails

**Check:**
1. Are all 3 version numbers the same?
2. Is the tag format correct? (`v1.4.28`, not `1.4.28`)
3. Is Rust/Android SDK available in CI? (usually automatic)

**Solution:** Fix the issue, delete the tag, and try again:
```powershell
git tag -d v1.4.28
git push origin :refs/tags/v1.4.28
# Make fixes, then retag
git tag v1.4.28
git push origin v1.4.28
```

### Update Not Detected

**Check:**
1. Is `latest.json` in the release?
2. Wait 5 minutes (GitHub CDN caching)
3. Check app version: Help → About (should show current version)

**Solution:** Restart the app or wait for the hourly check.

### Not Receiving Error Emails

**Check:**
1. Is the webhook deployed and running?
   ```powershell
   curl https://your-railway-url/health
   ```
   Should return: `{"status":"ok"}`

2. Check Railway logs for errors

3. Verify GitHub secret `ERROR_LOG_ENDPOINT` is set

4. Test the webhook directly:
   ```powershell
   curl -X POST https://your-railway-url/api/error-logs `
     -H "Content-Type: application/json" `
     -d '{"logs":[{"type":"error","category":"test","message":"Test","timestamp":123,"context":{"platform":"test","appVersion":"1.0","screenResolution":"1920x1080","apiKeysConfigured":{}}}]}'
   ```

**Solution:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed troubleshooting.

## CI Builds (No Release)

Every push to `main` or `develop` triggers CI builds:
- Runs tests
- Builds debug versions
- No release created

This ensures code quality before releasing.

## Advanced: Signed Updates

For production, you should sign your updates:

1. Generate signing keypair:
   ```powershell
   cargo install tauri-cli
   cargo tauri signer generate -w ~/.tauri/myapp.key
   ```

2. Add public key to `App/src-tauri/tauri.conf.json`:
   ```json
   {
     "plugins": {
       "updater": {
         "pubkey": "YOUR_PUBLIC_KEY_HERE"
       }
     }
   }
   ```

3. Add private key to GitHub Secrets:
   - Name: `TAURI_PRIVATE_KEY`
   - Value: Contents of `~/.tauri/myapp.key`

4. Uncomment signing steps in `.github/workflows/release.yml`

## Quick Links

- 📖 [Full Deployment Guide](DEPLOYMENT_GUIDE.md)
- 🐛 [Error Reporting Setup](CLIENT_ERROR_REPORTING.md)
- 🔄 [Auto-Update System](CI_CD_AUTO_UPDATE.md)
- 📱 [Phone Quick Start](PHONE_QUICK_START.md)
