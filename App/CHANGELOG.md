# Changelog

All notable changes to the Solar Panel Calculator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [1.4.9] - 2025-11-16
## [1.4.10] - 2025-11-16

### Added
- **Universal Multi-Site Product Search**: Shopping Cart now performs intelligent fallback queries across major retailers when initial results are sparse.
  - Automatic site filtering for identifiers: ASIN → `site:amazon.com`, UPC/EAN → Amazon, Walmart, Home Depot, Lowes.
  - Broader pricing context fallback (`price` enriched query) when no direct matches.
  - Source labeling on each result (Amazon, Walmart, Home Depot, etc.) for instant provenance clarity.
- **Result Source Visibility**: Each product now shows a compact source badge based on the query variant that returned it.
- **Repeated Error Differentiation**: Search errors display occurrence count and last timestamp (e.g., "Repeated 3× — last at 14:32:05").

### Changed
- **Adaptive Query Strategy**: Identifier-specific queries use literal forms first; enhancement only applied to vague inputs. Added exact quoted variant for model numbers.
- **Usage Tracking**: API usage now counts each fallback request to reflect actual quota consumption.
- **Tab Highlight Softening**: Reduced tab pill border/shadow intensity to eliminate unneeded highlighted appearance.

### Fixed
- **Ambiguous Failed Fetch Feedback**: Consecutive identical errors now clearly show repetition metadata so user can distinguish new vs. repeat failures.
- **Low Amazon Product Hit Rate**: ASIN searches now prioritize literal code and targeted site filters for more reliable retrieval.

### Notes
- Fallback multi-site requests only trigger when initial query returns few/no results (performance-friendly design).
- Future roadmap: optional direct page parsing for richer specs if CORS-permitted.


### Fixed
- **Product Search Accuracy**: Dramatically improved shopping cart search to use literal queries for specific product identifiers
  - UPC codes (12-14 digits) now search exactly as entered without extra terms
  - ASIN codes (Amazon product IDs) search with the exact code for accurate results
  - EAN codes (8-13 digits) supported for international products
  - Model numbers (e.g., "RNG-400D") now use quoted exact match with minimal modification
  - Respects user-quoted searches for exact matches
  - Long queries (>25 chars) treated as already specific and minimally enhanced
  - Short/vague queries still get AI enhancement for better results
- **Category Dropdown Styling**: Applied `premium-select` class with theme-matching colors
  - Styled with accent color on hover and focus
  - Dark background options for better contrast
  - Smooth transitions matching app theme

### Changed
- **Adaptive API Pricing Information**: Updated all API cost details to reflect current actual rates
  - Google Cloud Console: $300 free trial for 90 days (new accounts, was $200)
  - Google AI Studio: 15 RPM / 1M TPM / 1500 RPD for Gemini Flash (free forever)
  - OpenAI: $0.15-$15 per 1M tokens depending on model (GPT-5, GPT-4o, o1)
  - Anthropic Claude 3.5 Sonnet: $3 input / $15 output per 1M tokens
  - Added explanations for rate limit abbreviations (RPM, TPM, RPD)
  - Added note about regional variations and account-specific offers
  - Clarified that AI Studio is separate from Cloud Console
- Search query enhancement now intelligently decides when to modify vs. use literal search


## [1.4.8] - 2025-11-16

### Added
- **Save Changes Button**: APIs tab now has a "Save Changes" button that applies configuration updates without requiring app restart
  - Visual feedback shows "Saving...", then "✓ Changes Saved!" with green confirmation
  - Triggers `apiKeysUpdated` event for live configuration reload
- **Enhanced API Setup Instructions**: Comprehensive 3-option guide in APIs tab:
  - **Option 1 (Easiest)**: Unified Key from Google Cloud Console - single key for all services
  - **Option 2 (More Control)**: Separate keys per service, including Google AI Studio for Gemini (1500 free requests/day)
  - **Option 3 (Best Quality)**: Multi-provider setup with OpenAI, Anthropic Claude, xAI Grok
  - Detailed comparison: easiest setup, most free credits, best AI quality, best value long-term
  - Platform-specific restrictions guidance (web, Android, desktop)
- **AI-Enhanced Shopping Search**: Dramatically improved product search capabilities:
  - **Smart Query Detection**: Automatically recognizes UPC (12-14 digits), ASIN (B + 9 chars), model numbers
  - **AI Query Enhancement**: Uses available AI provider to optimize search queries for better results
  - **Category Filtering**: Filter search results by product category (panels, inverters, batteries, etc.)
  - **Intelligent Ranking**: AI-powered result sorting for relevance
  - **Expanded Search Types**: Support for product names, model numbers, UPCs, ASINs, brands, general descriptions
  - Enhanced search UI with examples and smart search tips

### Fixed
- **Scrollbar Transparency in Fullscreen**: Eliminated white scrollbar backgrounds in fullscreen mode
  - Added `!important` overrides for `:fullscreen`, `:-webkit-full-screen`, `:-moz-full-screen` pseudo-classes
  - Enforced transparent background on all scrollbar tracks and corners across all states
  - Fixed issue where scrollbars would show white background when entering/exiting fullscreen

### Changed
- APIs tab layout improved with sticky save button at top
- Shopping Cart search interface redesigned with better UX and feature discoverability
- Product search now uses category context for more accurate results

## [1.4.7] - 2025-11-16

### Fixed
- **External Links (Windows & All Platforms)**: Fixed external link opening to properly use system default browser. Updated `openExternal.ts` to correctly import and use `@tauri-apps/plugin-shell` at the top level instead of dynamic import, ensuring reliable opening in default browser on Windows and other desktop platforms.
- **Fullscreen White Flash**: Completely eliminated white flicker during fullscreen transitions by:
  - Using `!important` CSS declarations on all background colors in `index.html`
  - Adding theme-color meta tags for better browser behavior
  - Creating a temporary dark overlay during transition in `FullscreenButton.tsx`
  - Enforcing dark backgrounds with `setProperty(..., 'important')` before fullscreen toggle
  - Extended transition delay to 20ms for proper style application

### Changed
- Enhanced `openExternalUrl()` with static imports for better reliability and console logging
- Added meta theme-color tags (`#020617`) to HTML head for smoother platform integration
- Improved fullscreen button implementation with overlay technique to prevent any white flashes

## [1.4.6] - 2025-11-17

### Fixed
- **External Links**: Windows (and all platforms) now properly open external links in default browser using Tauri shell plugin (`@tauri-apps/plugin-shell`)
- **Fullscreen Flicker**: Eliminated white flash during fullscreen transitions by enforcing dark background with small delay before transition
- Added `shell:allow-open` permission to Tauri capabilities for proper link handling

### Changed
- Replaced legacy Tauri API imports with official v2 shell plugin
- Enhanced fullscreen background persistence across root element

## [1.4.5] - 2025-11-17

### Fixed
- Global themed scrollbars enforced across the app; eliminated default gray scrollbars. Added/verified `modern-scroll` on key lists and tables.
- External links now open reliably via platform-aware opener (Tauri shell, Capacitor Browser, web fallback). Replaced in-app anchors in Shopping Cart, APIs tab, and Solar integration.
- Fullscreen white flicker removed by setting dark backgrounds early and pre-setting before toggling fullscreen.
- Dynamic sun hours label: shows "Peak Daily Sun Hours" for daily mode and "Total Yearly Sun Hours" for yearly mode.

### Changed
- APIs tab adds Quick Start guidance and a "Use Unified Google Key" shortcut for Gemini.
- Themed dashboard data table scroll container for consistent look and feel.

### Release
- Version bumped across Node/Tauri/Android; CI configured to attach artifacts to the GitHub release for quick downloads.

## [1.4.3] - 2025-11-16

### Fixed
- **Chat Controls Alignment**: Upload Files, Start/Stop Voice, and Play Last Reply buttons now align on one row with equal height (h-9)
- **Themed Scrollbars**: Applied smooth blue gradient scrollbars to API Usage and Shopping Cart overflow lists; removed arrow buttons
- **Configurator Collapse**: Fixed left panel to preserve reopen handle when minimized; no longer "gone forever" after collapse

### Changed
- Configurator container uses width toggle (`w-[24rem]` → `w-0`) instead of unmounting to maintain persistent edge handle
- Added `modern-scroll` class to all overflow containers for consistent themed scrollbar experience

## [1.4.2] - 2025-11-16

### Fixed
- Ensure GitHub release assets are attached reliably for quick downloads
- Include Windows EXE (NSIS) artifact and consistent filenames across platforms
- Minor workflow robustness tweaks during release attach phase

### Notes
- This version primarily addresses release asset availability so README quick links work immediately after publish.

## [1.4.1] - 2025-11-16

### Fixed
- CI release pipeline reliability: replaced deprecated tauri-action step with direct build + robust artifact upload
- Ensured stable artifact names and added Windows EXE (NSIS) alongside MSI
- Improved GitHub release creation to avoid intermittent timeout when attaching assets
- README Quick Download links point to stable filenames produced by CI

### Notes
- If you tried v1.4.0 quick links earlier, they may have 404’d while CI was attaching assets. v1.4.1 resolves this.

## [1.4.0] - 2025-11-16

### 🎨 UI/UX Improvements
- **Enhanced Scrollbar Styling**: Custom themed scrollbar with smooth cyan gradient (#38bdf8 → #0ea5e9)
  - 10px width for body, 8px for panels
  - Removed scrollbar arrow buttons for cleaner look
  - Added transparent scrollbar corner styling
  - Improved hover effects and visual consistency
- **Dynamic Chat Send Button**: Send button now dynamically matches textarea height in all aspect ratios
  - Reduced width from 90px to 70px for more typing space
  - Maintains proportions across different screen sizes
- **Dropdown Arrow Repositioning**: Moved expand/collapse arrows from left to right in Configurator fine-tune sections
  - Updated CSS with flexbox (justify-content: space-between)
  - Improved visual hierarchy and modern UI alignment
- **Configurator Persistent Toggle**: Collapse/expand functionality already in place
  - Minimize button in header
  - Expand button on left edge when collapsed
  - State persists across sessions

### 🤖 Multi-AI Provider Architecture
- **Advanced Provider Key Management**: Complete rewrite of AI provider system
  - Added `ProviderKeys` type for managing multiple provider keys simultaneously
  - New methods: `setProviderKey()`, `clearProviderKey()`, `getProviderKey()`, `hasProviderKey()`, `getAvailableProviders()`
  - Backward compatible with legacy `apiKey` field
- **Conditional Provider Button Display**: Only shows AI provider buttons for configured keys
  - Auto-selects first available provider if current one has no key
  - Dynamic provider availability checks
  - Cleaner chat interface without unused provider buttons
- **APIs Tab Restructure**: Separated API key management into logical sections
  - Removed Gemini-specific input from single field
  - Added dedicated inputs for Google Gemini, OpenAI, Anthropic Claude, xAI Grok
  - Split into "Google Cloud APIs" and "AI Provider Keys" sections
  - Each provider has independent key storage and clear functionality
- **Google API Key Fallback**: Gemini chat can use unified Google API key or dedicated Gemini key
  - Automatic fallback hierarchy: provider key → unified key → gemini key
  - Seamless integration with Google Solar API keys

### 🔧 Code Quality
- **API Configuration Centralization**: Removed all API key inputs from Solar Integration tab
  - Simplified SolarApiIntegration.tsx (~150 lines removed)
  - Single source of truth for API management in APIs tab
  - Clearer user workflow and reduced UI clutter
- **ChatAssistant.tsx Modernization**: Complete rewrite for multi-provider support
  - Replaced single `apiKey` with per-provider key retrieval
  - Added `availableProviders` memoization for performance
  - Conditional rendering based on `hasProviderKey()` checks
  - Improved error messages with provider-specific guidance
- **External Link Verification**: Confirmed `openExternalUrl` utility works correctly
  - Tauri shell.open for desktop
  - Capacitor Browser for mobile
  - window.open fallback for web

### Technical
- Enhanced `chatStore.ts` with `ProviderKeys` mapped type
- Updated `ApisTab.tsx` with separate inputs per AI provider
- Refactored `ChatAssistant.tsx` for conditional provider UI
- CSS improvements in `index.css` for scrollbar theming and arrow positioning
- HTML structure updates in `Configurator.tsx` for arrow alignment

### Platform Support
- ✅ All changes tested and compiled successfully
- ✅ Cross-platform compatibility maintained (Windows, macOS, Linux, Android, iOS)
- ✅ No breaking changes to existing functionality

## [1.3.0] - 2025-11-16

### Added
- **💰 Loan Financing Calculator**: Complete financing mode with credit-based rate estimation
  - Toggle between Cash and Loan financing modes
  - Loan amount, term (5-30 years), and interest rate fields
  - Credit score input (300-850) with AI-powered rate estimator
  - Automatic rate estimation: 5.5% (780+), 6.5% (740-779), 7.5% (700-739), 8.5% (660-699), 10.0% (620-659), 12.0% (<620)
  - Monthly loan payment calculations using standard amortization formula
  - Break-even analysis adjusted for financing costs
  - 25-year projection includes loan payments in annual benefit calculations
  - Financial summary displays total loan cost and interest paid
- **📦 Bulk Equipment Pricing**: Per-unit and bulk package pricing for all equipment
  - Panels: Toggle between per-unit cost and bulk package pricing (1-100 units)
  - Inverters: Separate pricing mode with bulk options (1-100 units)
  - Batteries: Independent pricing toggle with bulk quantities (1-10 units)
  - Smart cost calculations automatically use effective pricing based on selected mode
  - Conditional field disabling (per-unit field disabled in bulk mode, vice versa)
- **☀️ Yearly Sun Hours Mode**: Support for annual sun hours instead of daily
  - Toggle between daily (hrs/day) and yearly (hrs/year) modes
  - Automatic conversion in production calculations
  - Max value updated to 8760 hrs (365 days × 24 hours)
  - Matches Google Solar API output format
  - Dynamic suffix changes based on selected mode
- **🎨 Custom Scrollbar Theming**: Modern gradient scrollbar design
  - Smooth blue gradient (rgba(56,189,248) → rgba(14,165,233))
  - Transparent track with subtle white border
  - No arrow buttons (display: none)
  - 12px main scrollbar, 8px panel scrollbars
  - Hover effects for enhanced usability
- **📐 Resized Fullscreen Button**: Repositioned to avoid chat assistant overlap
  - Reduced from h-5 w-5 to h-4 w-4
  - Moved from top-4 right-4 to top-3 right-3
  - Smaller padding (p-2 from p-2.5)
  - More compact rounded-lg (from rounded-xl)
- **🎛️ Collapsible Sidebars**: Minimize configurator and chat assistant for more dashboard space
  - Configurator collapses to left edge with vertical tab
  - Chat Assistant collapses to right edge with vertical tab
  - One-click expand/collapse with arrow icons
  - Dashboard automatically expands when panels are minimized
  - State persists across sessions

### Changed
- **Enhanced Financial Model**: Loan payments integrated into all projections
  - `buildProjectionRow()`: Subtracts annual loan payments from total benefit during loan term
  - `buildFinancialSummary()`: Calculates effective upfront cost (net cost - loan amount)
  - Break-even year accounts for financing mode (compares against loan-adjusted cost)
- **Improved Equipment Costing**: New helper functions for flexible pricing
  - `getEffectivePanelCost()`: Returns bulk or per-unit cost based on pricing mode
  - `getEffectiveInverterCost()`: Mode-aware inverter pricing
  - `getEffectiveBatteryCost()`: Smart battery cost calculation
  - `calculateTotalUpfrontCost()`: Uses effective costs for all equipment
- **Extended Configuration Schema**: 23 new configuration fields
  - New field types: `modeToggle`, `bulkPricing`, `loanEstimate`
  - Financing Options section with 5 fields
  - Bulk pricing fields for panels, inverters, batteries (12 fields total)
  - Sun hours mode toggle and dynamic peak sun hours field
- **Configurator UI Enhancements**: New field type handlers
  - `modeToggle`: Horizontal 2-button toggle (Cash/Loan, Daily/Yearly, Per Unit/Bulk)
  - `bulkPricing`: Number input for package quantities with "units" suffix
  - `loanEstimate`: Credit score input with "Estimate Rate" AI button + real-time rate preview
- **Default Values Updated**: New defaults for all added fields
  - `sunHoursMode: 'daily'`, `pricingMode: 'perUnit'`
  - `panelBulkCount: 1`, `panelBulkCost: 6720`
  - `inverterPricingMode: 'perUnit'`, `inverterBulkCount: 1`, `inverterBulkCost: 3500`
  - `batteryPricingMode: 'perUnit'`, `batteryBulkCount: 1`, `batteryBulkCost: 12000`
  - `financingMode: 'cash'`, `loanAmount: 0`, `loanTermYears: 25`, `loanInterestRate: 6.5`, `creditScore: 720`

### Fixed
- **TypeScript Compilation**: Removed unused imports and variables
  - Fixed `SolarApiIntegration.tsx` unused imports
  - Fixed `googleApis.ts` unused loop variable

### Technical
- Added `FinancingMode` type: `'cash' | 'loan'`
- Added `PricingMode` type: `'perUnit' | 'bulk'`
- Added `SunHoursMode` type: `'daily' | 'yearly'`
- Implemented `calculateMonthlyLoanPayment(principal, rate, years)` with standard amortization
- Implemented `estimateLoanRate(creditScore)` with 6 credit tier brackets
- Extended `SolarConfig` interface with 23 new fields
- Updated all calculation utilities to support new pricing and financing modes
- Conditional field rendering in configurator based on parent toggle states

## [1.2.0] - 2025-11-16

### Added
- **🌞 Google Solar API Integration**: Complete integration with Google's Solar API for real-world roof analysis
  - Address-based solar potential lookup using Google Maps Geocoding
  - Detailed roof segment analysis (pitch, azimuth, area, sun exposure)
  - Building insights with imagery dates and quality scores
  - Solar panel configuration recommendations from Google
  - Financial analysis with cash purchase, financed, and leasing options
  - Carbon offset calculations
  - Maximum sunshine hours and energy production estimates
- **🤖 AI-Powered Solar Recommendations**: Solar API data is automatically sent to AI for intelligent analysis
  - AI receives comprehensive roof analysis, panel specs, and financial data
  - Provides panel placement recommendations based on real roof geometry
  - Suggests optimizations for energy production
  - Analyzes cost-benefit and ROI with real-world data
  - Identifies potential issues and structural considerations
- **🔑 Flexible API Key Management**: 
  - Unified Google Cloud API key option (one key for Solar, Maps, and Gemini)
  - Separate key option for independent service management
  - Optional usage - app works fully without Google APIs
  - Secure local storage with show/hide password fields
  - Clear individual keys or all at once
- **📱 iOS Build Pipeline**: Added complete iOS build support in GitHub Actions
  - Automated IPA generation via Xcode
  - CocoaPods dependency management
  - Capacitor iOS platform sync
  - Release artifact uploads
- **New Dashboard Tab**: "Google Solar API" tab for analyzing any property address

### Changed
- **Enhanced Chat Assistant**: Now automatically receives Solar API context for property-specific recommendations
- **Improved AI Context**: Solar data formatted into comprehensive prompts with roof specs, panel configs, and financial projections
- **Build System**: Android workflow now skips system dependency checks in CI environment (prevents false positives)

### Fixed
- **Android CI Build**: Postinstall dependency check now detects CI environment and skips premature system package validation
- **iOS Platform Configuration**: Added proper iOS setup with app ID, bundle ID, and platform-specific settings

### Technical
- Created `google-apis.ts` types with comprehensive Solar API response interfaces
- Implemented `googleApis.ts` utilities for Solar API, Maps Geocoding, and data formatting
- Added `googleApiStore.ts` Zustand store with persist middleware for API key management
- Created `SolarApiIntegration.tsx` component with address input and real-time analysis
- Enhanced `chatStore.ts` with `sendMessage` method for programmatic AI queries
- Updated GitHub Actions workflow with iOS job (Xcode build, export, artifact upload)
- Modified `check-deps.cjs` to skip validation when `CI` or `GITHUB_ACTIONS` env vars are set

## [1.1.0] - 2025-11-16

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

## [3.0.0] - 2025-11-16

### Added
- Automated GitHub Actions workflow for building and releasing desktop and mobile apps
- One-click download support for Windows, macOS, Linux, and Android
- Automated release creation when version tags are pushed

### Changed
- Improved release and deployment process with GitHub Actions

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
- Offline functionality
- Secure encrypted API key storage (desktop only)

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

[Unreleased]: https://github.com/leothefleo49/Solar-Panel-Calculator/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/leothefleo49/Solar-Panel-Calculator/releases/tag/v3.0.0
[1.0.0]: https://github.com/leothefleo49/Solar-Panel-Calculator/releases/tag/v1.0.0
