/**
 * Types for Amex export file format.
 * Replace with actual structure once you have an example file.
 */

export interface AmexTransaction {
  /** Date of the transaction (YYYY-MM-DD) */
  date: string;
  /** Description or payee (Beskrivning) */
  description: string;
  /** Amount in currency units (negative = outflow) */
  amount: number;
  /** Card member name (Kortmedlem) */
  cardMember?: string;
  /** Optional: account reference (Konto #) */
  accountRef?: string;
  /** Optional: currency code */
  currency?: string;
  /** Optional: raw line or extra fields */
  raw?: string;
}

export interface AmexParseResult {
  transactions: AmexTransaction[];
  /** Parsing errors or warnings */
  errors: string[];
  /** Source filename if available */
  sourceName?: string;
}
