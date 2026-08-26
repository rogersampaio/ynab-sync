/**
 * Service to parse Amex export files (Swedish CSV: Datum, Beskrivning, Kortmedlem, Konto #, Belopp).
 */

import type { AmexParseResult, AmexTransaction } from "../types/amex";

/** Split a CSV line respecting double-quoted fields (quoted fields may contain delimiter). */
function splitCsvLine(line: string, delimiter: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        inQuotes = false;
      } else {
        current += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === delimiter) {
        parts.push(current.trim());
        current = "";
      } else {
        current += c;
      }
    }
  }
  parts.push(current.trim());
  return parts;
}

/** Parse European number (e.g. "46,29", "−250,00" with Unicode minus, or quoted). */
function parseAmount(value: string): number | null {
  const cleaned = value
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\u2212/g, "-") // Unicode minus (U+2212) → ASCII minus
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parse MM/DD/YYYY to YYYY-MM-DD. */
function parseDate(value: string): string | null {
  const trimmed = value.trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return null;
  const [, month, day, year] = match;
  const m = month.padStart(2, "0");
  const d = day.padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Simple non-crypto hash for stable short ids (djb2). */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return h >>> 0;
}

/** Base36 encode a positive integer (0-9, a-z). */
function toBase36(n: number, maxLen: number): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let s = "";
  let x = n;
  while (x > 0 && s.length < maxLen) {
    s = chars[x % 36] + s;
    x = Math.floor(x / 36);
  }
  return s.slice(-maxLen).padStart(maxLen, "0");
}

/** Build a stable import_id for YNAB deduplication (max 36 chars). */
export function amexImportId(tx: AmexTransaction): string {
  const milli = Math.round(tx.amount * 1000);
  const dateCompact = tx.date.replace(/-/g, "");
  const payload = `${tx.date}|${milli}|${tx.description ?? ""}|${tx.cardMember ?? ""}`;
  const hash = toBase36(hashStr(payload), 8);
  const amountPart = milli < 0 ? `m${-milli}` : `${milli}`;
  const id = `AMEX:${dateCompact}:${amountPart}:${hash}`;
  return id.length > 36 ? id.slice(0, 36) : id;
}

/**
 * Parse Amex Swedish CSV (Datum, Beskrivning, Kortmedlem, Konto #, Belopp).
 * Positive amount in file = outflow (we store negative); negative amount in file = inflow (we store positive).
 */
export function parseAmexFile(
  file: File,
  content: string,
): Promise<AmexParseResult> {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const transactions: AmexTransaction[] = [];
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      resolve({
        transactions: [],
        errors: ["File has no data rows (need header + at least one row)."],
        sourceName: file.name,
      });
      return;
    }
    const headerLine = lines[0];
    const delimiter = headerLine.includes(";") ? ";" : ",";
    const headers = splitCsvLine(headerLine, delimiter).map((h) => h.trim());
    const col = (name: string) => {
      const i = headers.findIndex((h) => h === name || h.replace(/\s+/g, " ").includes(name));
      return i >= 0 ? i : -1;
    };
    const iDate = col("Datum");
    const iDesc = col("Beskrivning");
    const iMember = col("Kortmedlem");
    const iKonto = headers.findIndex((h) => h === "Konto #" || h.includes("Konto"));
    const iBelopp = col("Belopp");
    if (iDate < 0 || iBelopp < 0) {
      resolve({
        transactions: [],
        errors: [
          `Expected CSV columns including "Datum" and "Belopp". Found: ${headers.join(", ")}`,
        ],
        sourceName: file.name,
      });
      return;
    }
    for (let r = 1; r < lines.length; r++) {
      const row = lines[r];
      const parts = splitCsvLine(row, delimiter);
      const get = (i: number) => (i >= 0 && i < parts.length ? parts[i].trim().replace(/^"|"$/g, "") : "");
      const dateStr = get(iDate);
      const amountStr = get(iBelopp);
      const date = parseDate(dateStr);
      const amountNum = parseAmount(amountStr);
      if (!date) {
        errors.push(`Row ${r + 1}: invalid date "${dateStr}"`);
        continue;
      }
      if (amountNum === null) {
        errors.push(`Row ${r + 1}: invalid amount "${amountStr}"`);
        continue;
      }
      const description = iDesc >= 0 ? get(iDesc) : "";
      const cardMember = iMember >= 0 ? get(iMember) : undefined;
      const accountRef = iKonto >= 0 ? get(iKonto) : undefined;
      // Positive in file → outflow (negative); negative in file (e.g. −250,00) → inflow (positive)
      const amount = amountNum > 0 ? -amountNum : Math.abs(amountNum);
      transactions.push({
        date,
        description,
        amount,
        cardMember: cardMember || undefined,
        accountRef: accountRef || undefined,
      });
    }
    resolve({
      transactions,
      errors,
      sourceName: file.name,
    });
  });
}

/**
 * Read file as text (for CSV / plain text Amex exports).
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
}
