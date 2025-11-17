# Solar Panel Calculator - Desktop & Mobile App

> 🌞 **Professional solar PV financial & technical analysis dashboard** with glassmorphism UI, high-precision modeling, AI-powered assistance, and **Google Solar API integration**.

[![Download Latest Release](https://img.shields.io/github/v/release/leothefleo49/Solar-Panel-Calculator?style=for-the-badge&logo=github)](https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest)
[![Platform Support](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android%20%7C%20iOS-blue?style=for-the-badge)](#)

---

## 📥 Quick Download (Pick your OS)

Click your operating system to download the latest installer directly:

- 🪟 Windows (Installer):
  https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest/download/Solar-Panel-Calculator-Windows.msi
- 🪟 Windows (Portable EXE):
  https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest/download/Solar-Panel-Calculator-Windows.exe
- 🍎 macOS (Universal DMG):
  https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest/download/Solar-Panel-Calculator-macOS.dmg
- 🐧 Linux (AppImage):
  https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest/download/Solar-Panel-Calculator-Linux.AppImage
- 🐧 Linux (Debian/Ubuntu .deb):
  https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest/download/Solar-Panel-Calculator-Linux.deb
- 📱 Android (APK):
  https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest/download/Solar-Panel-Calculator-Android-Unsigned.apk
- 🍏 iOS (Simulator App – for developers):
  https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest/download/Solar-Panel-Calculator-iOS-Simulator.zip

**Important for Desktop Users:**
- 🔄 **Auto-updater requires v1.4.10+**: Download and install this version manually to enable automatic updates for future releases!
- Once installed, the app will notify you of new versions and offer one-click updates

**Platform Notes:**
- Windows: Use the MSI if unsure. The EXE is a portable run-and-go.
- macOS: If blocked, right‑click the app → Open (first run).
- Linux AppImage: Right‑click file → Properties → make executable.
- Android: Enable "Install unknown apps" in your device settings.
- iOS: See iOS Deployment Options below for web/PWA/self-build instructions.

---

## ✨ Features

### Core Capabilities
- **🌍 Google Solar API Integration** (Enhanced in v1.4.8+):
  - Analyze any property address with real-world roof data from Google's Solar API
  - Automatic geocoding and coordinate lookup
  - Detailed roof segment analysis (pitch, azimuth, area, sun exposure)
  - AI-powered recommendations using actual roof geometry
  - Financial projections based on real sun exposure data
  - **Enhanced Setup Wizard**: 3 recommended paths (easiest, most free, best quality)
  - **Instant Config Updates**: Save Changes button applies settings without restart
  - **API Validation** (v1.4.10): Pre-save key testing with detailed error messages
  - **Quota Monitoring** (v1.4.10): Real-time usage tracking with visual indicators
  - Flexible key management (unified or separate for Solar/Maps/Shopping)
  - Optional - app works fully without Google APIs
- **🛒 Shopping Cart with AI Search** (Enhanced in v1.4.10):
  - Smart product search supporting names, model numbers, UPC, ASIN, brand names
  - AI-powered query enhancement for better results
  - Multi-site fallbacks with source attribution (Amazon, Walmart, Home Depot, Lowes, eBay)
  - Category filtering and intelligent result ranking
  - Automatic product spec extraction and compatibility checking
  - Integration with Google Shopping API for real-time pricing
  - Repetition-aware error reporting with timestamps
- **Comprehensive Configurator**: Collapsible sections for utility costs, incentives, solar hardware, battery storage, and soft costs with contextual tooltips
- **High-Precision Modeling**: Decimal.js engine simulates 25-year production, degradation, inflation-adjusted utility spend, net-metering cash flow, ROI, and break-even timing
- **Interactive Visualizations**: Multi-line crossover charts, degradation trends, monthly production vs. consumption bars, and battery/outage simulator
- **Data Studio**: Sortable amortization table with optional monthly expansion (up to 250 rows) for deep financial analysis
- **AI Chat Assistant**: Multi-provider support (Google Gemini, OpenAI GPT, Anthropic Claude, xAI Grok) with up to 5 concurrent conversation threads and Solar API context integration
- **Modern UX**: Dark-mode glassmorphism panels, responsive layout, accessible tooltips, auto-expanding chat input, fullscreen mode

### Desktop App Benefits
✅ Runs completely offline after installation  
✅ **Automatic updates** (v1.4.10+) – Get new features without manual downloads  
✅ Secure encrypted API key storage  
✅ Native OS integration (taskbar, notifications)  
✅ Faster performance vs. browser  
✅ No tracking or telemetry  
✅ Fullscreen mode support  

### Mobile App Benefits
📱 Full feature parity with desktop  
📱 Touch-optimized UI  
📱 Works offline after first load  
📱 Install directly from APK/IPA (no app store required)  
📱 Persistent chat history and API keys  

---

## 🚀 For Developers

### Desktop App Development

```bash
# Clone repo
git clone https://github.com/leothefleo49/Solar-Panel-Calculator.git
cd "Solar-Panel-Calculator/App"

# Install dependencies
npm install

# Run desktop app in development mode
npm run tauri:dev

# Build production executable
npm run tauri:build
```

**Requirements**: Node.js 20+, Rust toolchain ([rustup.rs](https://rustup.rs/))

**Output locations:**
- Windows: `src-tauri/target/release/Solar Panel Calculator.exe`
- macOS: `src-tauri/target/release/bundle/macos/`
- Linux: `src-tauri/target/release/solar-panel-calculator`

---

### Android App Development

```bash
# Build web assets and sync to Android
npm run cap:sync

# Open in Android Studio
npm run cap:android

# Or build APK directly (requires Android SDK)
npm run cap:build:android
```

**Requirements**: Android Studio, SDK 33+, Java JDK 17+

**Output**: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

### Web Development (Traditional)

```bash
# Start Vite dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Open http://localhost:5173

---

## 🏗️ Tech Stack

- **Frontend**: React 19 + TypeScript (Vite)
- **State**: Zustand for global state management
- **Styling**: Tailwind CSS + @tailwindcss/forms
- **Math**: Decimal.js for financial precision
- **Charts**: Recharts for data visualizations
- **Desktop**: Tauri 2.x (Rust + WebView)
- **Mobile**: Capacitor 6.x (Native Android)
- **AI**: Multi-provider support (Google, OpenAI, Anthropic, xAI)

---

## 🔑 AI Chat Assistant Setup

The optional AI assistant supports **Google Gemini**, **OpenAI GPT**, **Anthropic Claude**, and **xAI Grok**.

### Option 1: Runtime API Keys (Recommended)
1. Launch the app
2. Navigate to "Solar Chat Assistant" panel
3. Select provider tab (Google/OpenAI/Claude/Grok)
4. Enter API key in the input field
5. Click "Use Key"

**Desktop**: Keys are encrypted and stored locally  
**Mobile/Web**: Keys are memory-only (cleared on refresh)

### Option 2: Environment Variables (Development)
Create `.env` in the project root:

```env
VITE_GOOGLE_API_KEY=AIza...
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GROK_API_KEY=xai-...
```

**⚠️ Never commit this file to git!**

### Supported Models
- **Google**: Gemini 2.5 Pro/Flash, 2.0 Ultra/Flash, 1.5 Pro/Flash (with image upload support)
- **OpenAI**: GPT-5, GPT-4.1, GPT-4o, GPT-4-turbo, GPT-3.5-turbo
- **Anthropic**: Claude 3.5 Sonnet/Haiku, Claude 3 Opus
- **xAI**: Grok-2, Grok-2-mini

### Features
- ✅ Up to 5 concurrent conversation threads
- ✅ Auto-expanding chat input (up to 3× height)
- ✅ Image upload support (Gemini only)
- ✅ System-aware context (array size, ROI, savings)
- ✅ Enter to send, Shift+Enter for new line

---

## 📁 Key Files

- `src/components/Configurator.tsx` – Input interface with tooltips and resource links
- `src/components/Dashboard.tsx` – Tabbed visualizations, charts, outage simulator
- `src/components/ChatAssistant.tsx` – Multi-provider AI chat interface
- `src/state/solarStore.ts` – Zustand store for configuration data
- `src/state/chatStore.ts` – Zustand store for conversation threads
- `src/utils/calculations.ts` – High-precision production/savings/ROI math
- `src/utils/aiProviders.ts` – API wrappers for AI providers
- `src-tauri/` – Rust backend for desktop app
- `android/` – Native Android project files
- `capacitor.config.ts` – Mobile app configuration

---

## 🔒 Security & Privacy

- ✅ **No telemetry or tracking**
- ✅ **Calculations run 100% locally**
- ✅ **API keys encrypted at rest (desktop)**
- ✅ **Open-source—audit the code yourself**
- ✅ **Content Security Policy (CSP) enforced**
- ✅ **Sandboxed execution (Tauri)**

For production deployments, route AI API requests through a secure backend proxy with rate limiting.

---

## 📦 Distribution

### Automated Releases (CI)
Push a semantic git tag (e.g. `v3.0.1`) to trigger the CI matrix build:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions produces clearly named artifacts:
- `SolarPanelCalculator-Setup-x64.msi` / `SolarPanelCalculator-x64.exe`
- `SolarPanelCalculator-arm64.dmg` / `SolarPanelCalculator-x64.dmg`
- `SolarPanelCalculator-x86_64.AppImage`
- `solar-panel-calculator_<version>_amd64.deb`
- `solar-panel-calculator-<version>.x86_64.rpm`
- `solar-panel-calculator-release.apk`
- (Planned) `SolarPanelCalculator.ipa` (after iOS pipeline added)

Each release also includes a checksum file `SHA256SUMS.txt` for integrity verification.

#### Integrity Verification
```bash
sha256sum -c SHA256SUMS.txt --ignore-missing
```
Matches = file is authentic. Mismatch = re-download.

#### Portable vs Installer (Windows)
- Use `.msi` for start menu shortcuts & automatic uninstall.
- Use standalone `.exe` if running from USB or without admin rights.

#### Linux AppImage Usage
```bash
chmod +x SolarPanelCalculator-x86_64.AppImage
./SolarPanelCalculator-x86_64.AppImage
```

#### macOS Gatekeeper
If blocked, right-click → Open (first run) or:
```bash
xattr -dr com.apple.quarantine "SolarPanelCalculator-arm64.dmg"
```

### Manual Build
See [RELEASE_INSTRUCTIONS.md](./RELEASE_INSTRUCTIONS.md) for detailed build instructions, signing, and troubleshooting.

---

## 🐛 Troubleshooting

### Desktop App Issues
- **Windows**: Install [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)
- **macOS**: Allow app in System Preferences → Security & Privacy
- **Linux**: `sudo apt install libwebkit2gtk-4.1-dev`

### Android Issues
- **Build fails (exit code 1/126)**: Ensure executable gradlew permissions (`chmod +x android/gradlew` on Unix CI), verify JDK 17 and Android Gradle Plugin 8.7+, run `npm run cap:sync` before building.
- **Dependency resolution errors**: Clear Gradle cache `rm -rf ~/.gradle/caches` (Unix) or use Android Studio *Invalidate Caches*.
- **Resource merge failures**: Run `./gradlew clean` then rebuild.
- **App crashes on launch**: Confirm `minSdkVersion` (23) device compatibility; run `adb logcat` to inspect.
- **APK won't install**: Enable "Install from Unknown Sources"; verify architecture (x86 emulator cannot run arm64-only builds).

### CORS Errors
### iOS (Pending Pipeline)
- Use `npm run cap:ios` to open Xcode after adding iOS platform.
- Set signing team: Xcode → Project Settings → Signing & Capabilities.
- Increment build number each release.
- Export via *Archive* → *Distribute App* (TestFlight or Ad Hoc).

Planned CI will produce a signed `.ipa` once Apple credentials & notarization flow are added.
Desktop/Android handle CORS automatically. Web deployment requires backend proxy for AI APIs.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/) and [Capacitor](https://capacitorjs.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Math precision via [Decimal.js](https://mikemcl.github.io/decimal.js/)
- Icons from [Heroicons](https://heroicons.com/)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/leothefleo49/Solar-Panel-Calculator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/leothefleo49/Solar-Panel-Calculator/discussions)
- **Email**: [leothefleo49@gmail.com](mailto:leothefleo49@gmail.com)
- **Documentation**: [RELEASE_INSTRUCTIONS.md](./RELEASE_INSTRUCTIONS.md)

---

Made with ❤️ by [leothefleo49](https://github.com/leothefleo49)
