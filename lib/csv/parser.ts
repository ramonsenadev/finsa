import Papa from "papaparse";
import type {
  CsvFormatConfig,
  ParsedTransaction,
  ParseResult,
} from "@/types/csv";

const INSTALLMENT_REGEX = /\s*-\s*Parcela\s+(\d+)\/(\d+)$/;

// Patterns that identify credit card bill payments (transfers, not expenses).
// These should be excluded from import to avoid double-counting.
const PAYMENT_PATTERNS = [
  /pagamento\s+(recebido|fatura|de\s+fatura)/i,
  /pgto\s+(debito\s+conta|fatura)/i,
  /pagamento\s+efetuado/i,
];

function isPaymentEntry(title: string): boolean {
  return PAYMENT_PATTERNS.some((p) => p.test(title));
}

function parseDate(value: string, format: string): Date | null {
  if (!value || !value.trim()) return null;

  const trimmed = value.trim();

  if (format === "YYYY-MM-DD") {
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const d = new Date(+match[1], +match[2] - 1, +match[3]);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  if (format === "DD/MM/YYYY") {
    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const d = new Date(+match[3], +match[2] - 1, +match[1]);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  return null;
}

function parseAmount(value: string, locale: string): number | null {
  if (!value || !value.trim()) return null;

  let cleaned = value.trim().replace(/\s/g, "").replace(/^R\$\s*/, "");

  if (locale === "pt-BR") {
    // Remove thousand separator (dot), convert decimal separator (comma) to dot
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function extractInstallment(title: string): {
  description: string;
  installmentCurrent?: number;
  installmentTotal?: number;
} {
  const match = title.match(INSTALLMENT_REGEX);
  if (!match) {
    return { description: title };
  }

  return {
    description: title.replace(INSTALLMENT_REGEX, "").trim(),
    installmentCurrent: parseInt(match[1], 10),
    installmentTotal: parseInt(match[2], 10),
  };
}

export function parseCsv(
  content: string,
  format: CsvFormatConfig
): ParseResult {
  const errors: string[] = [];
  const transactions: ParsedTransaction[] = [];

  const result = Papa.parse<Record<string, string>>(content, {
    delimiter: format.delimiter,
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      errors.push(`Linha ${(err.row ?? 0) + 1 + format.skipRows}: ${err.message}`);
    }
  }

  const rows = result.data.slice(format.skipRows);
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 1 + format.skipRows;

    const rawDate = row[format.dateColumn];
    const rawTitle = row[format.descriptionColumn];
    const rawAmount = row[format.amountColumn];

    const date = parseDate(rawDate ?? "", format.dateFormat);
    if (!date) {
      skipped++;
      continue;
    }

    const amount = parseAmount(rawAmount ?? "", format.amountLocale);
    if (amount === null) {
      errors.push(`Linha ${lineNum}: valor inválido "${rawAmount}"`);
      skipped++;
      continue;
    }

    const title = (rawTitle ?? "").trim();
    if (!title) {
      errors.push(`Linha ${lineNum}: descrição vazia`);
      skipped++;
      continue;
    }

    const { description, installmentCurrent, installmentTotal } =
      extractInstallment(title);

    const rawLine = Object.values(row).join(format.delimiter);

    transactions.push({
      date,
      originalTitle: title,
      description,
      amount,
      installmentCurrent,
      installmentTotal,
      rawLine,
      isPayment: isPaymentEntry(title),
    });
  }

  let dateRange: { from: Date; to: Date } | null = null;
  if (transactions.length > 0) {
    const dates = transactions.map((t) => t.date.getTime());
    dateRange = {
      from: new Date(Math.min(...dates)),
      to: new Date(Math.max(...dates)),
    };
  }

  return {
    transactions,
    errors,
    stats: {
      total: rows.length,
      parsed: transactions.length,
      skipped,
      dateRange,
    },
  };
}

export { extractInstallment, parseDate, parseAmount };
