/**
 * Types for YNAB API integration.
 * @see https://api.ynab.com/
 */

export interface YnabConfig {
  accessToken: string;
  /** Plan (budget) ID to sync into */
  budgetId: string;
  /** Account ID within the plan */
  accountId: string;
}

/** Plan (budget) from GET /v1/plans */
export interface YnabPlan {
  id: string;
  name: string;
  last_modified_on?: string;
  first_month?: string;
  last_month?: string;
}

/** Account from GET /v1/plans/{plan_id}/accounts */
export interface YnabAccount {
  id: string;
  name: string;
  type: string;
  on_budget: boolean;
  closed: boolean;
  balance: number;
  note?: string | null;
}

export interface YnabTransactionPayload {
  date: string;
  amount: number; // in milliunits (e.g. -1000 = -10.00)
  payee_name?: string;
  memo?: string;
  cleared?: "cleared" | "uncleared" | "reconciled";
  /** Stable id for deduplication; same id = skip if already in YNAB */
  import_id?: string;
}

export interface YnabSyncResult {
  success: boolean;
  importedCount: number;
  duplicateCount?: number;
  errors: string[];
}
