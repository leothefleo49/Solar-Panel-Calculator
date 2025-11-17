# Quick Release Guide

## Release Checklist

Follow these steps to release a new version:

### 1. Update Version Numbers

Update version in these 3 files:

- [ ] `App/package.json` → `"version": "1.4.11"`
- [ ] `App/src-tauri/tauri.conf.json` → `"version": "1.4.11"`
- [ ] `App/src-tauri/Cargo.toml` → `version = "1.4.11"`

### 2. Commit and Tag

```powershell
# Stage changes
git add .

# Commit version bump
git commit -m "chore: bump version to 1.4.11"

# Push to main
git push origin main

# Create tag
git tag v1.4.11

# Push tag (this triggers the release build)
git push origin v1.4.11
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
- [ ] Solar-Panel-Calculator-Android.apk
- [ ] latest.json (update manifest)
- [ ] SHA256SUMS.txt

### 5. Test Auto-Update

1. Install the previous version on a test device
2. Open the app
3. Wait for update notification (or check immediately)
4. Click "Install & Restart" (desktop) or "Download Update" (Android)
5. Verify the update installs correctly

## Version Numbering

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.x.x): Breaking changes, major new features
- **MINOR** (x.4.x): New features, non-breaking changes
- **PATCH** (x.x.11): Bug fixes, small improvements

Examples:
- `1.4.11` → `1.4.12` (bug fix)
- `1.4.11` → `1.5.0` (new feature)
- `1.4.11` → `2.0.0` (breaking change)

## Troubleshooting

### Build Fails

**Check:**
1. Are all 3 version numbers the same?
2. Is the tag format correct? (`v1.4.11`, not `1.4.11`)
3. Is Rust/Android SDK available in CI? (usually automatic)

**Solution:** Fix the issue, delete the tag, and try again:
```powershell
git tag -d v1.4.11
git push origin :refs/tags/v1.4.11
# Make fixes, then retag
git tag v1.4.11
git push origin v1.4.11
```

### Update Not Detected

**Check:**
1. Is `latest.json` in the release?
2. Wait 5 minutes (GitHub CDN caching)
3. Check app version: Help → About (should show current version)

**Solution:** Restart the app or wait for the hourly check.

## CI Builds (No Release)

Every push to `main` or `develop` triggers CI builds:
- Runs tests
- Builds debug versions
- No release created

This ensures code quality before releasing.
