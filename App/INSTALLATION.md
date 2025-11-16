# Installation Guide

## Quick Downloads

Download the latest version for your platform from the [Releases page](https://github.com/leothefleo49/Solar-Panel-Calculator/releases).

### Desktop Platforms

#### Windows
1. Download `Solar-Panel-Calculator_<version>_x64_en-US.msi` from the latest release
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

#### macOS
**Intel Macs:**
1. Download `Solar-Panel-Calculator_<version>_x64.dmg`
2. Open the DMG file
3. Drag the app to Applications folder
4. First launch: Right-click → Open (to bypass Gatekeeper)

**Apple Silicon (M1/M2/M3):**
1. Download `Solar-Panel-Calculator_<version>_aarch64.dmg`
2. Open the DMG file
3. Drag the app to Applications folder
4. First launch: Right-click → Open (to bypass Gatekeeper)

#### Linux
**AppImage (Universal):**
1. Download `Solar-Panel-Calculator_<version>_amd64.AppImage`
2. Make it executable: `chmod +x Solar-Panel-Calculator_*.AppImage`
3. Run: `./Solar-Panel-Calculator_*.AppImage`

**Debian/Ubuntu (.deb):**
1. Download `Solar-Panel-Calculator_<version>_amd64.deb`
2. Install: `sudo dpkg -i Solar-Panel-Calculator_*.deb`
3. Run from applications menu or: `solar-panel-calculator`

### Mobile Platforms

#### Android
1. Download `Solar-Panel-Calculator-<version>.apk` from releases
2. Enable "Install from Unknown Sources" in Settings
3. Open the APK file and install
4. Launch from app drawer

**Note:** For a signed release-ready APK, you'll need to configure signing keys in Android Studio.

#### iOS
iOS builds require:
1. Apple Developer account ($99/year)
2. Xcode on macOS
3. Code signing certificates

**Building locally:**
```bash
npm run build
npx cap sync ios
npx cap open ios
# Build and sign in Xcode
```

For TestFlight/App Store distribution, configure signing in Xcode and submit through App Store Connect.

---

## Development Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Rust (for desktop builds)
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
# Web version
npm run dev

# Desktop (Tauri)
npm run tauri:dev

# Android
npm run cap:android

# iOS (macOS only)
npx cap sync ios
npx cap open ios
```

### Build for Production

#### Web
```bash
npm run build:prod
```

#### Desktop (All Platforms)
```bash
npm run tauri:build
```

#### Android
```bash
npm run cap:build:android
```

The APK will be in `android/app/build/outputs/apk/release/`

#### iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
# Build in Xcode: Product → Archive
```

---

## Platform-Specific Notes

### Windows
- Uses MSI installer format
- Requires Windows 10 or later
- Window sizes properly on multi-monitor setups

### macOS
- Universal builds available for both Intel and Apple Silicon
- First launch requires right-click → Open due to Gatekeeper
- Supports macOS 11 (Big Sur) and later

### Linux
- AppImage is self-contained and works on most distributions
- .deb packages for Debian/Ubuntu-based systems
- Requires GTK3 and WebKit2GTK

### Android
- Minimum SDK: API 22 (Android 5.1)
- Target SDK: API 34 (Android 14)
- Requires ~50MB storage
- Uses Capacitor for native features

### iOS
- Requires iOS 13.0 or later
- Uses Capacitor for native features
- Requires Xcode for building

---

## Troubleshooting

### Desktop: "Can't open links to external websites"
This is now fixed in the latest version. External links (Google Sunroof, NREL) open in your system browser.

### Desktop: "Window spans multiple screens"
Fixed in the latest version. The app now opens centered on your primary screen at 1400x900px.

### Mobile: "Links don't work"
The app now uses Capacitor Browser to open external links properly on mobile.

### API Keys Not Saving
API keys and chat history are now saved locally using browser storage (web) or native storage (mobile/desktop).

### Build Errors
1. Ensure all dependencies are installed: `npm install`
2. For Rust/Tauri: Verify Rust is installed: `rustc --version`
3. For Android: Ensure JAVA_HOME is set and points to JDK 17
4. For iOS: Ensure Xcode Command Line Tools are installed

---

## Automated Builds

The project includes GitHub Actions workflows that automatically build releases for all platforms when you push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will create:
- Windows MSI installer
- macOS DMG (Intel & Apple Silicon)
- Linux AppImage and .deb
- Android APK

Built artifacts are attached to the GitHub release automatically.
