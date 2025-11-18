# 🤖 AUTOMATIC VERSIONING & RELEASE SYSTEM

## ✅ What's Automated Now

### 1. **Automatic Version Syncing** ✨
When you change the version in `App/package.json`:
- ✅ Automatically updates `App/src-tauri/tauri.conf.json`
- ✅ Automatically updates `App/src-tauri/Cargo.toml`
- ✅ Automatically updates all version badges in `README.md`
- ✅ Automatically updates `PHONE_QUICK_START.md`
- ✅ Automatically updates `QUICK_RELEASE.md`
- ✅ Commits changes with `[skip ci]` to avoid infinite loops

### 2. **Automatic Release Creation** 🚀
When version changes are detected:
- ✅ Automatically creates git tag (e.g., `v1.4.13`)
- ✅ Automatically generates release notes from commits
- ✅ Automatically triggers release builds for all platforms
- ✅ No manual tagging needed!

### 3. **Automatic Documentation Updates** 📖
After release is created:
- ✅ Updates all download links to point to new version
- ✅ Updates version references throughout docs
- ✅ Commits documentation updates automatically

### 4. **Automatic Release Builds** 🏗️
When tag is pushed:
- ✅ Builds Windows (MSI + EXE)
- ✅ Builds macOS (DMG)
- ✅ Builds Linux (AppImage + DEB)
- ✅ Builds Android (APK)
- ✅ Generates `latest.json` for auto-updates
- ✅ Creates SHA256 checksums
- ✅ Uploads all assets to GitHub Release

## 🎯 How to Use It

### Super Simple Version Bump (2 steps!)

**Step 1: Change version in package.json**
```powershell
cd App
# Edit package.json and change version line:
# "version": "1.4.13"  →  "version": "1.4.14"
```

**Step 2: Commit and push**
```powershell
git add App/package.json
git commit -m "feat: add new awesome feature"
git push origin main
```

**That's it!** 🎉

The automation will:
1. Detect version change (1.4.13 → 1.4.14)
2. Sync version to all other files
3. Create git tag `v1.4.14`
4. Trigger release builds
5. Update all documentation
6. Wait 20-30 minutes → Done!

## 📋 What Happens Behind the Scenes

### Timeline:

**0:00** - You push commit with new version in package.json

**0:01** - Auto-version workflow starts
- Detects version changed
- Updates tauri.conf.json, Cargo.toml, README.md, etc.
- Commits changes with "[skip ci]"

**0:02** - Auto-release workflow starts
- Creates tag v1.4.14
- Generates release notes
- Pushes tag

**0:03** - Release build workflow starts
- Starts parallel builds for all platforms

**0:25** - Builds complete
- All installers uploaded to release
- latest.json created for auto-updates
- Release is live!

**0:26** - Documentation update workflow runs
- Updates all download links
- Commits documentation

**0:27** - Done! Users can download new version

## 🎨 Advanced Usage

### Bump Version with Message
```powershell
cd App
# Edit package.json version

git add App/package.json
git commit -m "feat: add dark mode toggle

- Add dark mode switch in settings
- Persist user preference
- Update all components"

git push origin main
```

The release notes will include all your commit messages!

### Skip Auto-Release
If you want to change version but NOT create a release:
```powershell
git commit -m "chore: bump version [skip release]"
```

Add `[skip release]` to prevent automatic tag creation.

### Manual Override
You can still create releases manually:
```powershell
git tag v1.4.15
git push origin v1.4.15
```

This will trigger the normal release workflow.

## 🔧 Workflows Created

### 1. `.github/workflows/auto-version.yml`
**Triggers:** Push to main branch with changes to `App/package.json`

**Jobs:**
- `sync-version` - Syncs version across all files
- `create-release` - Creates tag and triggers release
- `update-docs` - Updates documentation links

**Features:**
- Only runs if version actually changed
- Skips CI on auto-commits (prevents loops)
- Waits for version sync before creating tag
- Checks if tag already exists

### 2. `.github/workflows/release.yml` (Updated)
**Triggers:** Push of tag starting with `v`

**Jobs:**
- `build-tauri` - Desktop builds (Windows, macOS, Linux)
- `build-android` - Android APK
- `build-ios` - iOS simulator (optional)
- `checksums` - Generate SHA256SUMS.txt
- `release-attach` - Attach all artifacts to release
- `validate-downloads` - Verify download URLs work

**Features:**
- Injects ERROR_LOG_ENDPOINT from secrets
- All builds include error reporting
- Auto-update manifest generation
- Parallel builds for speed

## 🎯 Version Numbering Guide

Follow semantic versioning: `MAJOR.MINOR.PATCH`

### Patch (x.x.14)
**When:** Bug fixes, small improvements, typos
```json
"version": "1.4.13" → "1.4.14"
```
**Example commits:**
- "fix: correct calculation error"
- "fix: resolve crash on startup"
- "chore: update dependencies"

### Minor (x.5.0)
**When:** New features, non-breaking changes
```json
"version": "1.4.14" → "1.5.0"
```
**Example commits:**
- "feat: add dark mode"
- "feat: export to Excel"
- "feat: add Google Solar API"

### Major (2.0.0)
**When:** Breaking changes, major rewrites
```json
"version": "1.5.0" → "2.0.0"
```
**Example commits:**
- "feat!: redesign entire UI"
- "refactor!: change API structure"
- "feat!: migrate to new framework"

## 🚀 Benefits

### Before (Manual):
1. Update package.json
2. Update tauri.conf.json
3. Update Cargo.toml
4. Update README.md
5. Update QUICK_RELEASE.md
6. Update PHONE_QUICK_START.md
7. Commit changes
8. Create git tag
9. Push tag
10. Wait for builds
11. Update download links
12. Commit documentation
13. Total time: 10+ minutes of manual work

### After (Automatic):
1. Update package.json
2. Commit and push
3. **Everything else is automatic!**
4. Total time: 30 seconds of manual work

**Time saved: ~95%** 🎉

## 📊 What Gets Synced

| File | What Gets Updated |
|------|------------------|
| `App/package.json` | ✅ Source of truth (you edit this) |
| `App/src-tauri/tauri.conf.json` | ✅ Version field |
| `App/src-tauri/Cargo.toml` | ✅ Version field |
| `README.md` | ✅ Version badges, download links |
| `QUICK_RELEASE.md` | ✅ Example version numbers |
| `PHONE_QUICK_START.md` | ✅ Version references |

## ⚠️ Important Notes

### Commit Messages Matter!
Release notes are generated from your commit messages since the last tag:
```
Good: "feat: add export to PDF"
Bad:  "stuff"

Good: "fix: resolve memory leak in calculator"
Bad:  "oops"

Good: "docs: update installation guide"
Bad:  "asdf"
```

### [skip ci] Usage
Commits with `[skip ci]` in the message:
- ✅ Won't trigger CI builds (saves resources)
- ✅ Used by automation to prevent loops
- ✅ You can use it too for doc-only changes

Example:
```powershell
git commit -m "docs: fix typo [skip ci]"
```

### Testing Before Release
If you want to test changes without creating a release:
1. Create a feature branch
2. Make changes
3. Test locally with `npm run build`
4. Merge to main when ready
5. Bump version in main to trigger release

## 🎭 Example Workflow

Let's say you want to add a new export feature:

```powershell
# 1. Create feature branch
git checkout -b feature/pdf-export

# 2. Develop and test
# ... make your changes ...
npm run dev
npm run build

# 3. Merge to main
git checkout main
git merge feature/pdf-export

# 4. Bump version
cd App
# Edit package.json: "1.4.13" → "1.5.0"

# 5. Commit and push
git add App/package.json
git commit -m "feat: add PDF export functionality

- Add export button in toolbar
- Generate professional PDF reports
- Include charts and calculations
- Support custom branding"

git push origin main

# 6. Wait for automation
# ✅ Version synced to all files
# ✅ Tag v1.5.0 created
# ✅ Release builds started
# ✅ After 30 minutes: Release is live!

# 7. Check release
# https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest
```

## 🐛 Troubleshooting

### Auto-version didn't run
**Check:**
- Did you change `App/package.json`?
- Did you push to the `main` branch?
- Check Actions tab for workflow runs

### Tag already exists
**Solution:**
Delete the tag and push again:
```powershell
git tag -d v1.4.14
git push origin :refs/tags/v1.4.14
# Make changes and push again
```

### Version not synced properly
**Solution:**
Manually sync and commit:
```powershell
# Update files manually
git add -A
git commit -m "chore: manual version sync [skip ci]"
git push
```

### Release build failed
**Solution:**
- Check Actions tab for error logs
- Common issues: syntax errors, missing dependencies
- Fix the issue and create a new tag:
```powershell
git tag v1.4.15
git push origin v1.4.15
```

## 📚 Documentation

For more details:
- **[QUICK_RELEASE.md](QUICK_RELEASE.md)** - Manual release process (now optional!)
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deployment setup
- **[CI_CD_AUTO_UPDATE.md](CI_CD_AUTO_UPDATE.md)** - Auto-update system

## 🎉 Summary

You now have a **fully automated versioning and release system**!

### What you do:
1. Change version in package.json
2. Commit and push

### What happens automatically:
1. ✅ All files synced
2. ✅ Tag created
3. ✅ Release built for all platforms
4. ✅ Documentation updated
5. ✅ Release published
6. ✅ Users get updates

**It's that simple!** 🚀

---

**Last Updated:** November 17, 2025  
**System Version:** 2.0 (Fully Automated)
