# Solar System Financial & Technical Analysis Dashboard

Glassmorphism-inspired dashboard that helps homeowners stress-test every technical and financial lever in a solar project. The configurator keeps all variables in global state, while charts, metrics, and the amortization table re-run calculations instantly via a precision math engine.

## Features

- **Comprehensive configurator**: Collapsible sections span utility costs, incentives, solar hardware, BOS, storage, and soft costs, each with a contextual tooltip plus resource links for peak sun hours.
- **High-precision modeling**: Decimal.js engine simulates 25-year production, degradation, inflation-adjusted utility spend, net-metering cash flow, ROI, and break-even timing.
- **Interactive visuals**: Multi-line crossover chart, degradation trends, monthly production vs. consumption bars, and a resilient battery/outage simulator.
- **Data studio**: Sortable amortization table with optional monthly expansion (capped at 250 rows) for deep dives into production, savings, and cumulative cash flow.
- **Modern UX**: Dark-mode glass panels powered by Tailwind CSS, responsive two-column layout, and immediate feedback on every input tweak.

## Tech Stack

- React 19 + TypeScript (Vite)
- Zustand for global state management
- Tailwind CSS + @tailwindcss/forms styling
- Decimal.js for financial accuracy
- Recharts for data visualizations

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
```

## Key Files

- `src/components/Configurator.tsx` – guided input experience, tooltips, and resource links.
- `src/components/Dashboard.tsx` – tabbed visualizations, charts, outage simulator, and data sheet.
- `src/state/solarStore.ts` – central Zustand store for configuration + simulation inputs.
- `src/utils/calculations.ts` – high-precision production, savings, ROI, and battery math helpers.
- `src/constants/configSchema.ts` – declarative schema describing every configurator section/field.

## Ideas for Expansion

1. Persist multiple project scenarios (localStorage or backend) for homeowner comparisons.
2. Pull live irradiance/utility data (Project Sunroof, PVWatts APIs) to auto-populate key assumptions.
3. Export amortization data to CSV/PDF for financing packages or permit submissions.
