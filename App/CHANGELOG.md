# Changelog

All notable changes to the Solar Panel Calculator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Monthly/Yearly Input Toggle**: Users can now input monthly usage and costs as either monthly or yearly values. Toggle buttons allow easy switching between input modes.
- **Fullscreen Mode**: Added a fullscreen toggle button in the top-right corner that works across all platforms (desktop and web).
- **Persistent API Key Storage**: API keys are now saved locally using localStorage (web) and persist between sessions. Users can clear and update keys at any time.
- **Persistent Chat History**: All chat conversations are automatically saved locally and restored on app launch.
- **External Link Support**: 
  - Desktop (Tauri): Opens external links (Google Sunroof, NREL PVWatts) using system default browser via Tauri shell API
  - Mobile (iOS/Android): Opens links using Capacitor Browser plugin with in-app browser
  - Web: Opens links in new tab with proper security attributes
- **iOS Platform Support**: Added full iOS build configuration and scripts for building via Xcode
- **Comprehensive Installation Guide**: Created INSTALLATION.md with platform-specific instructions for Windows, macOS, Linux, Android, and iOS

### Changed
- **Window Sizing**: Desktop app now opens at 1400x900 pixels centered on the primary screen (previously 1840x1080 which could span multiple monitors)
- **Provider Dropdown Styling**: Improved layout with flex-wrap to prevent AI provider options (especially Grok) from being cut off
- **Chat Assistant UI**: Refined provider button layout with better wrapping on smaller screens
- **Scrollbar Theme**: Scrollbars now match the app's dark cyan/slate theme across all scrollable areas
- **Release Workflow**: Updated GitHub Actions to include installation instructions in release notes

### Fixed
- **External Links in Standalone Apps**: Links to Google Sunroof and NREL PVWatts now properly open in system/external browser instead of breaking in standalone builds
- **Multi-Monitor Window Positioning**: Desktop app no longer spans multiple monitors on Windows
- **Grok AI Provider Display**: Fixed dropdown cutoff that prevented full visibility of Grok option
- **API Key Management**: Users can now clear stored API keys via dedicated "Clear Key" button

### Technical
- Added `@capacitor/browser` plugin for mobile external link handling
- Implemented `openExternalUrl` utility with platform detection (Tauri/Capacitor/Web)
- Enhanced Tauri capabilities with `shell:allow-open` and window fullscreen permissions
- Added Zustand persist middleware for chat store with localStorage backend
- Updated TypeScript declarations for Tauri window and shell APIs
- Improved Capacitor configuration for both Android and iOS platforms

## [1.0.0] - Initial Release

### Added
- Solar panel system configurator with detailed input controls
- Real-time financial projections with 25-year analysis
- Interactive charts (ROI, break-even, production trends)
- Battery storage simulation
- AI chat assistant supporting:
  - Google Gemini (2.5 Pro, 2.5 Flash, 2.0 Ultra, 2.0 Flash, 1.5 Pro/Flash)
  - OpenAI GPT (5, 4.1, 4o, 4o-mini, 4-turbo, 3.5-turbo)
  - Anthropic Claude (3.5 Sonnet, 3.5 Haiku, 3 Opus)
  - xAI Grok (2, 2-mini)
- Multi-conversation chat management (up to 5 concurrent chats)
- Image analysis support with Gemini models
- Desktop builds for Windows, macOS (Intel & Apple Silicon), and Linux
- Android mobile app via Capacitor
- Responsive UI with glass-morphism design
- Dark theme with cyan accent colors

### Platform Support
- **Desktop**: Tauri-based native apps
  - Windows 10+ (x64)
  - macOS 11+ (Intel & Apple Silicon)
  - Linux (AppImage, .deb for Ubuntu/Debian)
- **Mobile**: Capacitor-based apps
  - Android 5.1+ (API 22+)
  - iOS 13.0+
- **Web**: Progressive Web App
  - Modern browsers with ES2020+ support

---

[Unreleased]: https://github.com/leothefleo49/Solar-Panel-Calculator/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/leothefleo49/Solar-Panel-Calculator/releases/tag/v1.0.0
