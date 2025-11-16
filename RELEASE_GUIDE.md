# Creating a Release

This document explains how to create a new release for the Solar Panel Calculator that will automatically build and publish binaries for all supported platforms.

## Automated Release Process

The repository is configured with GitHub Actions to automatically build desktop (Windows, macOS, Linux) and mobile (Android) applications when a version tag is pushed.

## Steps to Create a Release

### Option 1: Using Git Command Line (Recommended)

After merging this PR to the main branch:

```bash
# Make sure you're on the main branch and it's up to date
git checkout main
git pull origin main

# Create a version tag (e.g., v3.0.0)
git tag v3.0.0

# Push the tag to GitHub to trigger the release workflow
git push origin v3.0.0
```

### Option 2: Using GitHub Web Interface

1. Go to the repository on GitHub: https://github.com/leothefleo49/Solar-Panel-Calculator
2. Click on "Releases" in the right sidebar
3. Click "Create a new release" or "Draft a new release"
4. Click "Choose a tag" and type `v3.0.0` (or your desired version)
5. Select "Create new tag: v3.0.0 on publish" from the dropdown
6. Set the release title to: `Solar Panel Calculator v3.0.0`
7. In the description, you can copy content from `App/CHANGELOG.md`
8. Click "Publish release"

GitHub Actions will automatically:
- Build Windows executable (.exe and .msi)
- Build macOS applications (Intel and Apple Silicon .dmg)
- Build Linux packages (.AppImage, .deb, .rpm)
- Build Android APK
- Attach all binaries to the release

## What Happens During the Automated Build

The GitHub Actions workflow (`.github/workflows/release.yml`) will:

1. **Desktop Builds** (runs on Windows, Ubuntu, and macOS runners):
   - Set up Node.js and Rust toolchains
   - Install platform-specific dependencies
   - Build the Tauri desktop application for each platform
   - Create platform-specific installers
   - Upload binaries to the GitHub release

2. **Android Build** (runs on Ubuntu runner):
   - Set up Node.js, Java, and Android SDK
   - Build the React web application
   - Sync with Capacitor
   - Build the Android APK
   - Upload APK to the GitHub release

## Build Artifacts

Users will be able to download:

- **Windows**: 
  - `Solar.Panel.Calculator_3.0.0_x64_en-US.msi` (installer)
  - `Solar.Panel.Calculator_3.0.0_x64.exe` (portable)

- **macOS**:
  - `Solar.Panel.Calculator_3.0.0_x64.dmg` (Intel)
  - `Solar.Panel.Calculator_3.0.0_aarch64.dmg` (Apple Silicon)

- **Linux**:
  - `solar-panel-calculator_3.0.0_amd64.AppImage`
  - `solar-panel-calculator_3.0.0_amd64.deb`
  - `solar-panel-calculator_3.0.0_amd64.rpm`

- **Android**:
  - `app-release-unsigned.apk`

## Monitoring the Build

After pushing the tag:

1. Go to the "Actions" tab on GitHub
2. Look for the "Release Desktop & Mobile Apps" workflow
3. Click on it to see the build progress
4. Builds typically take 10-30 minutes depending on the platform

## Version Numbering

Before creating a new release, update the version number in:

1. `App/package.json` - Update the `"version"` field
2. `App/src-tauri/tauri.conf.json` - Update the `"version"` field
3. `App/CHANGELOG.md` - Add a new version section with changes

Follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Troubleshooting

### Build Fails

1. Check the Actions logs for specific errors
2. Ensure all dependencies are properly specified in package.json
3. Verify Rust and platform-specific dependencies are available

### Release Not Created

- Ensure you pushed a tag starting with `v` (e.g., `v3.0.0`)
- Check that the workflow file exists at `.github/workflows/release.yml`
- Verify GitHub Actions is enabled for the repository

### APK Issues

- If Android build fails, check that capacitor.config.ts is properly configured
- Ensure the Android project files in `App/android/` are up to date
- Try running `npx cap sync android` locally first

## Manual Testing Before Release

Before creating an official release, you can test the workflow:

```bash
# Create a test tag
git tag v3.0.0-beta.1
git push origin v3.0.0-beta.1
```

This will trigger the workflow without creating an official release.
