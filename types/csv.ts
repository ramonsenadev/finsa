export interface ParsedTransaction {
  date: Date;
  originalTitle: string;
  description: string;
  amount: number;
  installmentCurrent?: number;
  installmentTotal?: number;
  rawLine: string;
  isPayment: boolean; // credit card bill payment — should be excluded from import
}

export interface ParseStats {
  total: number;
  parsed: number;
  skipped: number;
  dateRange: { from: Date; to: Date } | null;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
  stats: ParseStats;
}

export interface CsvFormatConfig {
  delimiter: string;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  dateFormat: string;
  amountLocale: string;
  skipRows: number;
  encoding: string;
}
