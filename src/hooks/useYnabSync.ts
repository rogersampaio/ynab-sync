import { useState, useCallback } from 'react';
import type { YnabConfig, YnabSyncResult } from '../types/ynab';
import type { AmexTransaction } from "../types/amex";
import { pushTransactionsToYnab } from '../services/ynabApiService';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export function useYnabSync() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastResult, setLastResult] = useState<YnabSyncResult | null>(null);

  const sync = useCallback(
    async (config: YnabConfig, transactions: AmexTransaction[]) => {
      if (transactions.length === 0) {
        setLastResult({
          success: false,
          importedCount: 0,
          errors: ['No transactions to sync'],
        });
        setStatus('error');
        return;
      }
      setStatus('syncing');
      setLastResult(null);
      try {
        const result = await pushTransactionsToYnab(config, transactions);
        setLastResult(result);
        setStatus(result.success ? 'success' : 'error');
      } catch (err) {
        setLastResult({
          success: false,
          importedCount: 0,
          errors: [err instanceof Error ? err.message : 'Sync failed'],
        });
        setStatus('error');
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setLastResult(null);
  }, []);

  return { status, lastResult, sync, reset };
}
