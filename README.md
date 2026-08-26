# Amex → YNAB Sync

A local React app to upload an Amex export file and sync transactions to your YNAB account.

## Run locally

Copy `.env.example` to `.env` and set your YNAB Personal Access Token:

```bash
cp .env.example .env
# Edit .env and set VITE_YNAB_ACCESS_TOKEN=your_token
```

Then:

```bash
npm install
npm run dev
```

Then open the URL shown (e.g. http://localhost:5173). The `.env` file is gitignored and will not be committed.

## Project structure

- **`src/types/`** – TypeScript types for Amex data and YNAB API
- **`src/services/`** – Parsing and API logic  
  - `amexFileService.ts` – Parse Amex file (implement once you have an example)
  - `ynabApiService.ts` – YNAB API client (add token and budget/account IDs later)
- **`src/hooks/`** – React hooks for file handling and sync state
- **`src/components/`** – UI: file upload, “Sync to YNAB” button, sync status

## Next steps

1. **Amex file** – Add an example export and implement parsing in `src/services/amexFileService.ts` and extend `src/types/amex.ts` if needed.
2. **YNAB API** – Add your Personal Access Token and budget/account IDs (e.g. in env or a settings screen), then implement real requests in `src/services/ynabApiService.ts`.

Build: `npm run build`  
Preview build: `npm run preview`
