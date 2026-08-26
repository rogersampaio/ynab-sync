import type { SyncStatus as SyncStatusType } from "../hooks/useYnabSync";
import type { YnabSyncResult } from "../types/ynab";

interface SyncStatusProps {
  status: SyncStatusType;
  result: YnabSyncResult | null;
  onReset: () => void;
}

export function SyncStatus({ status, result, onReset }: SyncStatusProps) {
  if (status === "idle") return null;

  const isSuccess = status === "success";
  const isError = status === "error";
  const isSyncing = status === "syncing";

  return (
    <section
      className={`sync-status sync-status--${status}`}
      role="status"
      aria-live="polite"
    >
      {isSyncing && <p>Syncing to YNAB…</p>}
      {isSuccess && result && (
        <>
          <p>
            Sync complete. {result.importedCount} transaction(s) imported.
            {result.duplicateCount != null && result.duplicateCount > 0 && (
              <> {result.duplicateCount} duplicate(s) skipped.</>
            )}
          </p>
          <button type="button" onClick={onReset}>
            Done
          </button>
        </>
      )}
      {isError && result && (
        <>
          <p>Sync failed.</p>
          <ul className="sync-errors">
            {result.errors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
          <button type="button" onClick={onReset}>
            Try again
          </button>
        </>
      )}
    </section>
  );
}
