# CI/CD and Auto-Update System

This document explains the automated build, release, and update system for the Solar Panel Calculator.

## Overview

The project now has a comprehensive CI/CD pipeline that:
1. **Automatically builds and tests** on every commit to main/develop branches
2. **Creates releases** when you push a version tag
3. **Auto-updates apps** on user devices when new versions are available

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** 
- Every push to `main` or `develop` branches
- Every pull request to `main` or `develop`
- Manual trigger via GitHub Actions UI

**What it does:**
- ✅ Runs ESLint to check code quality
- ✅ Runs TypeScript type checking
- ✅ Runs smoke tests
- ✅ Builds desktop apps (Windows, macOS, Linux) in debug mode
- ✅ Builds Android APK in debug mode
- ✅ Builds web bundle

**Purpose:** Ensures every commit is tested and buildable before merging.

### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- When you push a git tag starting with `v` (e.g., `v1.4.11`)
- Manual trigger with option to include iOS builds

**What it does:**
- 🏗️ Builds production releases for:
  - Windows (`.msi` and `.exe` installers)
  - macOS (`.dmg` installer)
  - Linux (`.deb` and `.AppImage`)
  - Android (`.apk`)
  - iOS (simulator build, if enabled)
- 📝 Generates checksums for all artifacts
- 🔄 Creates `latest.json` update manifest for auto-updates
- 📦 Uploads all files to GitHub Release
- 🚀 Publishes the release automatically

## How to Release a New Version

### Step 1: Bump the Version

Update the version in **THREE** places:

1. **`App/package.json`**
```json
{
  "version": "1.4.11"
}
```

2. **`App/src-tauri/tauri.conf.json`**
```json
{
  "version": "1.4.11"
}
```

3. **`App/src-tauri/Cargo.toml`** (optional but recommended)
```toml
[package]
version = "1.4.11"
```

### Step 2: Commit and Tag

```powershell
# Commit the version changes
git add .
git commit -m "chore: bump version to 1.4.11"

# Create and push the tag
git tag v1.4.11
git push origin main
git push origin v1.4.11
```

### Step 3: Wait for the Build

- Go to **GitHub Actions** tab in your repository
- Watch the "Release Build Matrix" workflow
- It will take 15-30 minutes to build all platforms
- When complete, a new release will appear in the **Releases** section

### Step 4: Verify the Release

Check that your release includes:
- ✅ Windows installers (`.msi` and `.exe`)
- ✅ macOS installer (`.dmg`)
- ✅ Linux packages (`.deb` and `.AppImage`)
- ✅ Android APK
- ✅ `latest.json` (update manifest)
- ✅ `SHA256SUMS.txt` (checksums)

## Auto-Update System

### How It Works

#### Desktop (Windows, macOS, Linux)
1. **Tauri's built-in updater** checks for updates on startup and every 60 minutes
2. Fetches `latest.json` from GitHub releases
3. Compares current version with latest version
4. Shows notification if update is available
5. Downloads and installs update automatically
6. Prompts user to restart the app

#### Android
1. **Custom update checker** queries GitHub API for latest release
2. Compares version numbers
3. Shows notification with download link
4. Opens browser to download APK when user clicks "Download"
5. User installs APK manually (Android doesn't allow silent app updates)

#### Web
1. Checks for updates via GitHub API
2. Shows notification prompting user to refresh
3. Can redirect to latest hosted version

### Configuration

The auto-updater is configured in:

**`App/src-tauri/tauri.conf.json`:**
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

**Settings:**
- `active: true` - Enables the updater
- `endpoints` - Where to check for updates
- `dialog: true` - Shows built-in Tauri update dialog
- `pubkey` - (Optional) For signed updates (not currently implemented)

### Update Check Frequency

In **`App/src/App.tsx`:**
```typescript
useEffect(() => {
  initializeAutoUpdater(60) // Check every 60 minutes
    .catch(err => console.error('Failed to initialize auto-updater:', err))
}, [])
```

You can change the interval by modifying the number (in minutes).

### User Experience

When an update is available:

1. **Desktop Users:** See a notification in the bottom-right corner with:
   - Current version and new version
   - Release notes preview
   - "Install & Restart" button (auto-downloads and installs)
   - "Remind Later" button
   - "Dismiss" button

2. **Android Users:** See same notification with:
   - "Download Update" button (opens browser to download APK)
   - Manual installation required

3. **Web Users:** See notification with:
   - Link to download latest version
   - Or prompt to refresh page

## Testing Auto-Updates

### Test Locally

1. **Build a test version:**
   ```powershell
   cd App
   npm run tauri:build
   ```

2. **Install the built app** from `App/src-tauri/target/release/bundle/`

3. **Create a fake update:**
   - Bump version to `1.4.99` locally
   - Create a release on GitHub with this version
   - Open the installed app (v1.4.10)
   - It should detect v1.4.99 and prompt to update

### Test in CI

1. Push a release tag: `git tag v1.4.11-test && git push origin v1.4.11-test`
2. Wait for build to complete
3. Download and install the release artifacts
4. Push another tag: `v1.4.12-test`
5. Open the v1.4.11-test app
6. It should detect v1.4.12-test

## Troubleshooting

### Updates Not Detected

**Check:**
1. Is the app version in `package.json` and `tauri.conf.json` the same?
2. Is `latest.json` present in the GitHub release?
3. Is the GitHub API accessible? (Check network tab)
4. Are you running a development build? (Updates only work in production builds)

**Debug:**
Open DevTools (Ctrl+Shift+I or Cmd+Option+I) and check console for errors.

### Build Failures

**Common issues:**
1. **Rust not installed** (Desktop builds)
   - Solution: Install Rust from https://rustup.rs/
2. **Android SDK missing** (Android builds)
   - Solution: Handled automatically in CI
3. **Node version mismatch**
   - Solution: Use Node 20 (specified in workflows)

### Signed Updates (Optional)

For production, you should sign your updates to prevent tampering:

1. **Generate signing key:**
   ```powershell
   cargo install tauri-cli
   cargo tauri signer generate -w ~/.tauri/myapp.key
   ```

2. **Add public key to `tauri.conf.json`:**
   ```json
   {
     "plugins": {
       "updater": {
         "pubkey": "YOUR_PUBLIC_KEY_HERE"
       }
     }
   }
   ```

3. **Sign builds in CI** (add to release workflow):
   ```yaml
   env:
     TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
     TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
   ```

## File Structure

```
.github/
  workflows/
    ci.yml                    # Continuous integration
    release.yml               # Release builds

App/
  scripts/
    generate-update-manifest.mjs  # Creates latest.json
  src/
    components/
      UpdateNotification.tsx      # Update UI component
    utils/
      updater.ts                  # Update logic
  src-tauri/
    tauri.conf.json          # Updater configuration
    Cargo.toml               # Rust dependencies
    src/
      lib.rs                 # Tauri updater plugin initialization
```

## Best Practices

1. **Always test builds before releasing**
   - Use the CI workflow on a feature branch first
   - Verify all platforms build successfully

2. **Keep version numbers in sync**
   - package.json and tauri.conf.json must match
   - Use semantic versioning (MAJOR.MINOR.PATCH)

3. **Write meaningful release notes**
   - Add notes when creating the tag
   - Users see these in the update notification

4. **Don't delete releases**
   - Old releases serve as update checkpoints
   - Users on old versions can update incrementally

5. **Monitor release downloads**
   - Check GitHub Insights > Traffic to see download stats
   - Helps understand update adoption rates

## Additional Resources

- [Tauri Updater Documentation](https://tauri.app/v1/guides/distribution/updater)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
