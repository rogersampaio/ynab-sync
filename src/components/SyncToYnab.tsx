import { useState, useCallback, useEffect } from "react";
import type { YnabConfig, YnabPlan, YnabAccount } from "../types/ynab";
import type { AmexTransaction } from "../types/amex";
import { fetchPlans, fetchAccounts } from "../services/ynabApiService";

interface SyncToYnabProps {
  transactions: AmexTransaction[];
  onSync: (config: YnabConfig, transactions: AmexTransaction[]) => void;
  disabled?: boolean;
}

export function SyncToYnab({
  transactions,
  onSync,
  disabled = false,
}: SyncToYnabProps) {
  const accessToken =
    (import.meta.env.VITE_YNAB_ACCESS_TOKEN as string)?.trim() || "";

  const [plans, setPlans] = useState<YnabPlan[]>([]);
  const [accounts, setAccounts] = useState<YnabAccount[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const loadPlans = useCallback(async () => {
    if (!accessToken) {
      setLoadError("Missing VITE_YNAB_ACCESS_TOKEN in .env");
      return;
    }
    setLoadError(null);
    setLoadingPlans(true);
    const { plans: list, error } = await fetchPlans(accessToken);
    setLoadingPlans(false);
    if (error) {
      setLoadError(error);
      setPlans([]);
      setSelectedPlanId("");
      setAccounts([]);
      setSelectedAccountId("");
      return;
    }
    setPlans(list);
    if (list.length > 0 && !selectedPlanId) {
      setSelectedPlanId(list[0].id);
    }
  }, [accessToken, selectedPlanId]);

  useEffect(() => {
    if (!selectedPlanId || !accessToken) return;
    let cancelled = false;
    const run = async () => {
      const { accounts: list, error } = await fetchAccounts(
        accessToken,
        selectedPlanId,
      );
      if (cancelled) return;
      setLoadingAccounts(false);
      if (error) {
        setAccountsError(error);
        setAccounts([]);
        setSelectedAccountId("");
        return;
      }
      const open = list.filter((a) => !a.closed);
      setAccounts(open);
      setSelectedAccountId((prev) =>
        open.some((a) => a.id === prev) ? prev : open[0]?.id ?? "",
      );
    };
    queueMicrotask(() => {
      setLoadingAccounts(true);
      setAccountsError(null);
    });
    run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, selectedPlanId]);

  const handleSync = () => {
    if (!accessToken || !selectedPlanId || !selectedAccountId) return;
    const config: YnabConfig = {
      accessToken,
      budgetId: selectedPlanId,
      accountId: selectedAccountId,
    };
    onSync(config, transactions);
  };

  const canSync =
    transactions.length > 0 &&
    !disabled &&
    Boolean(selectedPlanId && selectedAccountId);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <section className="sync-to-ynab" aria-labelledby="sync-heading">
      <h2 id="sync-heading">Sync to YNAB</h2>

      <div className="ynab-account-select">
        <p className="sync-hint">Choose the YNAB account to import into.</p>
        {!accessToken ? (
          <p className="ynab-error">
            Set <code>VITE_YNAB_ACCESS_TOKEN</code> in <code>.env</code>.
          </p>
        ) : (
          <>
            <div className="ynab-row">
              <label htmlFor="ynab-plan">Plan (budget)</label>
              <div className="ynab-row-input">
                <select
                  id="ynab-plan"
                  value={selectedPlanId}
                  onChange={(e) => {
                    setSelectedPlanId(e.target.value);
                    setSelectedAccountId("");
                  }}
                  disabled={loadingPlans || plans.length === 0}
                  aria-describedby={loadError ? "ynab-plan-error" : undefined}
                >
                  {plans.length === 0 && !loadingPlans && (
                    <option value="">Load plans first</option>
                  )}
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="ynab-load-btn"
                  onClick={loadPlans}
                  disabled={loadingPlans}
                  aria-label="Load plans from YNAB"
                >
                  {loadingPlans ? "Loading…" : "Load plans"}
                </button>
              </div>
            </div>
            {loadError && (
              <p id="ynab-plan-error" className="ynab-error" role="alert">
                {loadError}
              </p>
            )}

            <div className="ynab-row">
              <label htmlFor="ynab-account">Account</label>
              <select
                id="ynab-account"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={loadingAccounts || !selectedPlanId || accounts.length === 0}
                aria-describedby={accountsError ? "ynab-account-error" : undefined}
              >
                {!selectedPlanId && <option value="">Select a plan first</option>}
                {selectedPlanId && accounts.length === 0 && !loadingAccounts && (
                  <option value="">No accounts</option>
                )}
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>
            {accountsError && (
              <p id="ynab-account-error" className="ynab-error" role="alert">
                {accountsError}
              </p>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        className="sync-button"
        onClick={handleSync}
        disabled={!canSync}
        aria-describedby="sync-desc"
      >
        Sync to YNAB
      </button>
      <p id="sync-desc" className="sync-desc">
        {transactions.length === 0
          ? "Upload an Amex file first."
          : selectedAccount
            ? `${transactions.length} transaction(s) → ${selectedAccount.name}`
            : `${transactions.length} transaction(s) ready. Select an account.`}
      </p>
    </section>
  );
}
