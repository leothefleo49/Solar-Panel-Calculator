# Solar Panel Calculator - Release & Deployment Guide

## 📦 Platform Support

- **Desktop**: Windows, macOS, Linux (via Tauri)
- **Mobile**: Android (via Capacitor)
- **Web**: Progressive Web App

---

## 🚀 Quick Start (Local Development)

### Desktop App (Recommended for PC)

```bash
# Install dependencies
npm install

# Run desktop app in development mode
npm run tauri:dev

# Build desktop executable
npm run tauri:build
```

**Output locations:**
- Windows: `src-tauri/target/release/Solar Panel Calculator.exe`
- macOS: `src-tauri/target/release/bundle/macos/Solar Panel Calculator.app`
- Linux: `src-tauri/target/release/solar-panel-calculator`

---

### Android Mobile App

```bash
# Install dependencies
npm install

# Build and open Android Studio
npm run cap:android

# Or build APK directly (requires Android SDK)
npm run cap:build:android
```

**Output**: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 📥 One-Click Download from GitHub

### For Users

1. Go to [Releases](https://github.com/leothefleo49/Solar-Panel-Calculator/releases)
2. Download the latest version for your platform:
   - **Windows**: `Solar.Panel.Calculator_1.0.0_x64_en-US.msi` or `.exe`
   - **macOS**: `Solar.Panel.Calculator_1.0.0_x64.dmg` (Intel) or `_aarch64.dmg` (Apple Silicon)
   - **Linux**: `solar-panel-calculator_1.0.0_amd64.AppImage` or `.deb`
   - **Android**: `app-release.apk`

3. Install and run!

### Automated Releases

Releases are automatically built when you push a git tag:

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will build for all platforms and create a release with downloadable binaries.

---

## 🏗️ Manual Build Instructions

### Prerequisites

**Desktop (Tauri):**
- Node.js 20+
- Rust toolchain: https://rustup.rs/

**Windows additional:**
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 11)

**macOS additional:**
- Xcode Command Line Tools: `xcode-select --install`

**Linux additional:**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**Android:**
- Android Studio with SDK 33+
- Java JDK 17+
- Gradle 8+

---

### Building from Source

```bash
# Clone repository
git clone https://github.com/leothefleo49/Solar-Panel-Calculator.git
cd "Solar-Panel-Calculator/App"

# Install dependencies
npm install

# Build for desktop
npm run tauri:build

# Build for Android
npm run cap:build:android
```

---

## 🔧 Production Configuration

### Environment Variables (Optional)

Create `.env.production`:

```env
# Pre-configure API keys (optional, stored encrypted on desktop)
VITE_GOOGLE_API_KEY=your_key_here
VITE_OPENAI_API_KEY=your_key_here
VITE_ANTHROPIC_API_KEY=your_key_here
VITE_GROK_API_KEY=your_key_here
```

**Security Note**: Desktop app stores API keys in encrypted local storage. Web/mobile store in-memory only.

---

## 📱 Mobile-Specific Setup

### Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Signing the APK (for Play Store)

```bash
cd android
./gradlew assembleRelease

# Sign with your keystore
jarsigner -verbose -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore my-release-key.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  alias_name

# Zipalign
zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk \
  solar-panel-calculator.apk
```

---

## 🐛 Troubleshooting

### Desktop App Won't Start
- **Windows**: Install WebView2 from https://developer.microsoft.com/microsoft-edge/webview2/
- **macOS**: Grant app permission in System Preferences > Security & Privacy
- **Linux**: Ensure webkit2gtk-4.1 is installed

### Android Build Fails
- Check Android SDK version (must be 33+)
- Run `npx cap sync android` to refresh
- Clean build: `cd android && ./gradlew clean`

### CORS Errors with AI APIs
- Desktop app handles CORS automatically via Tauri
- Mobile/Web: Ensure CSP settings in capacitor.config.ts allow API domains

---

## 📊 Performance Optimizations

- **Code Splitting**: Vite automatically chunks by route
- **Asset Compression**: Gzip/Brotli in production build
- **Tree Shaking**: Unused code eliminated
- **Lazy Loading**: Charts/components load on-demand

---

## 🔐 Security Best Practices

1. **API Keys**: Never commit to git. Use env vars or secure storage.
2. **CSP**: Content Security Policy configured in tauri.conf.json
3. **Updates**: Desktop app checks for updates on launch
4. **Sandboxing**: Tauri runs in a secure sandbox by default

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

- **Issues**: https://github.com/leothefleo49/Solar-Panel-Calculator/issues
- **Discussions**: https://github.com/leothefleo49/Solar-Panel-Calculator/discussions
