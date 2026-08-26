/**
 * YNAB API client.
 * @see https://api.ynab.com/
 */

import type {
  YnabAccount,
  YnabConfig,
  YnabPlan,
  YnabSyncResult,
  YnabTransactionPayload,
} from "../types/ynab";
import type { AmexTransaction } from "../types/amex";
import { amexImportId } from "./amexFileService";

const YNAB_API_BASE = "https://api.ynab.com/v1";

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

/**
 * Push transactions to YNAB with import_id so re-uploading the same file skips duplicates.
 */
export async function pushTransactionsToYnab(
  config: YnabConfig,
  transactions: AmexTransaction[],
): Promise<YnabSyncResult> {
  if (!config.accountId) {
    return { success: false, importedCount: 0, errors: ["No account selected."] };
  }
  const accountId = config.accountId;
  const payloads = transactions.map((tx) => ({
    account_id: accountId,
    date: tx.date,
    amount: Math.round(tx.amount * 1000),
    payee_name: tx.description || undefined,
    memo: tx.cardMember ? `Card: ${tx.cardMember}` : undefined,
    cleared: "uncleared" as const,
    import_id: amexImportId(tx),
  }));
  try {
    const res = await fetch(
      `${YNAB_API_BASE}/budgets/${config.budgetId}/transactions`,
      {
        method: "POST",
        headers: authHeaders(config.accessToken),
        body: JSON.stringify({ transactions: payloads }),
      },
    );
    const json = (await res.json()) as {
      data?: {
        transactions?: Array<{ id?: string; import_id?: string }>;
        duplicate_import_ids?: string[];
      };
      error?: { detail?: string };
    };
    if (!res.ok) {
      const detail = json.error?.detail ?? res.statusText;
      return {
        success: false,
        importedCount: 0,
        errors: [`${res.status}: ${detail}`],
      };
    }
    const created = json.data?.transactions ?? [];
    const importedCount = created.length;
    const duplicateCount = json.data?.duplicate_import_ids?.length ?? Math.max(0, transactions.length - importedCount);
    return {
      success: true,
      importedCount,
      duplicateCount,
      errors: [],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return { success: false, importedCount: 0, errors: [message] };
  }
}

/**
 * Convert Amex transaction to YNAB transaction payload (with import_id for deduplication).
 */
export function toYnabTransaction(
  tx: AmexTransaction,
): YnabTransactionPayload {
  return {
    date: tx.date,
    amount: Math.round(tx.amount * 1000),
    payee_name: tx.description,
    memo: tx.cardMember ? `Card: ${tx.cardMember}` : tx.raw ?? undefined,
    cleared: "uncleared",
    import_id: amexImportId(tx),
  };
}

/**
 * Fetch plans (budgets) from YNAB.
 * @see https://api.ynab.com/ – GET /plans
 */
export async function fetchPlans(
  accessToken: string,
): Promise<{ plans: YnabPlan[]; error?: string }> {
  try {
    const res = await fetch(`${YNAB_API_BASE}/plans`, {
      headers: authHeaders(accessToken),
    });
    const json = (await res.json()) as {
      data?: { plans?: YnabPlan[]; budgets?: YnabPlan[] };
      error?: { detail?: string };
    };
    if (!res.ok) {
      const detail = json.error?.detail ?? res.statusText;
      return { plans: [], error: `${res.status}: ${detail}` };
    }
    const plans = json.data?.plans ?? json.data?.budgets ?? [];
    return { plans };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch plans";
    return { plans: [], error: message };
  }
}

/**
 * Fetch accounts for a plan (budget).
 * @see https://api.ynab.com/ – GET /plans/{plan_id}/accounts
 */
export async function fetchAccounts(
  accessToken: string,
  planId: string,
): Promise<{ accounts: YnabAccount[]; error?: string }> {
  try {
    const res = await fetch(`${YNAB_API_BASE}/plans/${planId}/accounts`, {
      headers: authHeaders(accessToken),
    });
    const json = (await res.json()) as {
      data?: { accounts?: YnabAccount[] };
      error?: { detail?: string };
    };
    if (!res.ok) {
      const detail = json.error?.detail ?? res.statusText;
      return { accounts: [], error: `${res.status}: ${detail}` };
    }
    const accounts = json.data?.accounts ?? [];
    return { accounts };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch accounts";
    return { accounts: [], error: message };
  }
}
