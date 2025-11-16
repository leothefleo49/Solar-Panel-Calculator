# Solar Panel Calculator - Desktop & Mobile App

> 🌞 **Professional solar PV financial & technical analysis dashboard** with glassmorphism UI, high-precision modeling, and AI-powered assistance.

[![Download Latest Release](https://img.shields.io/github/v/release/leothefleo49/Solar-Panel-Calculator?style=for-the-badge&logo=github)](https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest)
[![Platform Support](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android-blue?style=for-the-badge)](#)

---

## 📥 Quick Download (For Users)

**Run locally on your PC or Android device—no internet required after installation!**

1. **Go to [Releases](https://github.com/leothefleo49/Solar-Panel-Calculator/releases/latest)**
2. **Download for your platform:**
   - 🪟 **Windows**: `.msi` installer (recommended) or `.exe`
   - 🍎 **macOS**: `.dmg` (Intel/Apple Silicon auto-detected)
   - 🐧 **Linux**: `.AppImage`, `.deb`, or `.rpm`
   - 📱 **Android**: `.apk` (enable "Install from Unknown Sources")

3. **Install & launch—all calculations run locally!**

---

## ✨ Features

### Core Capabilities
- **Comprehensive Configurator**: Collapsible sections for utility costs, incentives, solar hardware, battery storage, and soft costs with contextual tooltips
- **High-Precision Modeling**: Decimal.js engine simulates 25-year production, degradation, inflation-adjusted utility spend, net-metering cash flow, ROI, and break-even timing
- **Interactive Visualizations**: Multi-line crossover charts, degradation trends, monthly production vs. consumption bars, and battery/outage simulator
- **Data Studio**: Sortable amortization table with optional monthly expansion (up to 250 rows) for deep financial analysis
- **AI Chat Assistant**: Multi-provider support (Google Gemini, OpenAI GPT, Anthropic Claude, xAI Grok) with up to 5 concurrent conversation threads
- **Modern UX**: Dark-mode glassmorphism panels, responsive layout, accessible tooltips, auto-expanding chat input

### Desktop App Benefits
✅ Runs completely offline after installation  
✅ Secure encrypted API key storage  
✅ Native OS integration (taskbar, notifications)  
✅ Faster performance vs. browser  
✅ Auto-update checker  
✅ No tracking or telemetry  

### Mobile App Benefits
📱 Full feature parity with desktop  
📱 Touch-optimized UI  
📱 Works offline after first load  
📱 Install directly from APK (no Play Store required)  

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

### Automated Releases
Push a git tag to trigger multi-platform builds:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions builds:
- Windows (x64)
- macOS (Intel + Apple Silicon)
- Linux (AppImage, deb, rpm)
- Android APK

Artifacts are automatically attached to the [Releases](https://github.com/leothefleo49/Solar-Panel-Calculator/releases) page.

### Manual Build
See [RELEASE_INSTRUCTIONS.md](./RELEASE_INSTRUCTIONS.md) for detailed build instructions, signing, and troubleshooting.

---

## 🐛 Troubleshooting

### Desktop App Issues
- **Windows**: Install [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)
- **macOS**: Allow app in System Preferences → Security & Privacy
- **Linux**: `sudo apt install libwebkit2gtk-4.1-dev`

### Android Issues
- **Build fails**: Check Android SDK version (must be 33+)
- **App crashes**: Run `npx cap sync android` to refresh
- **APK won't install**: Enable "Install from Unknown Sources" in Android settings

### CORS Errors
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
- **Documentation**: [RELEASE_INSTRUCTIONS.md](./RELEASE_INSTRUCTIONS.md)

---

Made with ☀️ by [leothefleo49](https://github.com/leothefleo49)
