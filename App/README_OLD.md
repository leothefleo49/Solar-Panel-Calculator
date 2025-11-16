# Solar System Financial & Technical Analysis Dashboard

Glassmorphism-inspired dashboard that helps homeowners stress-test every technical and financial lever in a solar project. The configurator keeps all variables in global state, while charts, metrics, and the amortization table re-run calculations instantly via a precision math engine.

## Features

- **Comprehensive configurator**: Collapsible sections span utility costs, incentives, solar hardware, BOS, storage, and soft costs, each with a contextual tooltip plus resource links for peak sun hours.
- **High-precision modeling**: Decimal.js engine simulates 25-year production, degradation, inflation-adjusted utility spend, net-metering cash flow, ROI, and break-even timing.
- **Interactive visuals**: Multi-line crossover chart, degradation trends, monthly production vs. consumption bars, and a resilient battery/outage simulator.
- **Data studio**: Sortable amortization table with optional monthly expansion (capped at 250 rows) for deep dives into production, savings, and cumulative cash flow.
- **Modern UX**: Dark-mode glass panels powered by Tailwind CSS, responsive multi-column layout, immediate feedback, accessible tooltips, and integrated solar chat assistant.

## Tech Stack

- React 19 + TypeScript (Vite)
- Zustand for global state management
- Tailwind CSS + @tailwindcss/forms styling
- Decimal.js for financial accuracy
- Recharts for data visualizations
- Optional AI (user-provided API key) for contextual Q&A

## Getting Started

Install dependencies (rerun if packages change):

```powershell
Set-Location "c:\Users\User\Solar Panel Calculator\App"
npm install
```

Launch the dev server with hot reload:

```powershell
Set-Location "c:\Users\User\Solar Panel Calculator\App"
npm run dev -- --open
```

Create a production build and preview it locally:

```powershell
Set-Location "c:\Users\User\Solar Panel Calculator\App"
npm run build
npm run preview -- --host

## Solar Chat Assistant (Optional)

You can enable an AI assistant to answer planning and calculation questions with system-aware context. It supports both Google Gemini (multi-modal) and OpenAI text models.

### 1. Supply an API Key

Add your provider key at runtime in the "Solar Chat Assistant" panel. Keys are kept only in memory (never written to disk). For production use a secure server proxy—never expose a permanent key client-side.

Alternatively, create a `.env` file and add (only store keys locally, never commit):

```
VITE_OPENAI_API_KEY=sk-your-openai-key-here
VITE_GOOGLE_API_KEY=AIza...your-google-key-here
```

Then in `ChatAssistant.tsx` keys are read via `import.meta.env.VITE_OPENAI_API_KEY` / `import.meta.env.VITE_GOOGLE_API_KEY` as fallbacks.

### 2. Attach Images (Gemini only)

Use the image upload control to send one or more images (roof layout, utility bill screenshot, equipment spec sheet). They are base64-encoded client-side and passed to Gemini 2.5 Flash for multimodal interpretation.

### 3. Ask Contextual Questions

The assistant receives a summarized snapshot (array size, annual production, ROI, break-even, savings) so you can ask things like:

- "How would increasing degradation from 0.5% to 0.7% affect 25-year savings?"
- "Is my break-even year reasonable compared to national averages?"
- "What battery size would cover a 10-hour outage?"

### 4. Implementation Notes

- Uses provider-specific `fetch` calls (`openai` vs `gemini`) abstracted in `src/utils/aiProviders.ts`.
- Key is stored only in React/Zustand state. Refresh clears it.
- For streaming responses, enhance `handleSend` with `ReadableStream` processing.

### 5. Security Reminder

In production, route requests through a backend service that injects the key server-side and applies rate limiting & logging.

## Key Files (Updated)
```

## Key Files

- `src/components/Configurator.tsx` – guided input experience, tooltips, and resource links.
- `src/components/Dashboard.tsx` – tabbed visualizations, charts, outage simulator, and data sheet.
- `src/state/solarStore.ts` – central Zustand store for configuration + simulation inputs.
- `src/utils/calculations.ts` – high-precision production, savings, ROI, and battery math helpers.
- `src/constants/configSchema.ts` – declarative schema describing every configurator section/field.
- `src/components/ChatAssistant.tsx` – optional AI assistant interface using user-supplied API key.
- `src/state/chatStore.ts` – Zustand store for chat messages and ephemeral key.

## Ideas for Expansion

1. Persist multiple project scenarios (localStorage or backend) for homeowner comparisons.
2. Pull live irradiance/utility data (Project Sunroof, PVWatts APIs) to auto-populate key assumptions.
3. Export amortization data to CSV/PDF for financing packages or permit submissions.
