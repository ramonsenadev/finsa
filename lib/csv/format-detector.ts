import type { CsvFormatConfig } from "@/types/csv";

const NUBANK_FORMAT: CsvFormatConfig = {
  delimiter: ",",
  dateColumn: "date",
  descriptionColumn: "title",
  amountColumn: "amount",
  dateFormat: "YYYY-MM-DD",
  amountLocale: "en",
  skipRows: 0,
  encoding: "UTF-8",
};

const ITAU_FORMAT: CsvFormatConfig = {
  delimiter: ";",
  dateColumn: "data",
  descriptionColumn: "lançamento",
  amountColumn: "valor",
  dateFormat: "DD/MM/YYYY",
  amountLocale: "pt-BR",
  skipRows: 0,
  encoding: "ISO-8859-1",
};

const INTER_FORMAT: CsvFormatConfig = {
  delimiter: ";",
  dateColumn: "Data",
  descriptionColumn: "Descrição",
  amountColumn: "Valor",
  dateFormat: "DD/MM/YYYY",
  amountLocale: "pt-BR",
  skipRows: 0,
  encoding: "UTF-8",
};

export function detectFormat(csvContent: string): CsvFormatConfig | null {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;

  const headerLine = lines[0];

  // Detect delimiter
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const isSemicolon = semicolonCount > commaCount;

  const headerLower = headerLine.toLowerCase();

  // Nubank: comma-separated, columns: date, title, amount
  if (
    !isSemicolon &&
    headerLower.includes("date") &&
    headerLower.includes("title") &&
    headerLower.includes("amount")
  ) {
    return NUBANK_FORMAT;
  }

  // Itaú: semicolon, columns contain "data" and "lançamento" or "lancamento"
  if (isSemicolon) {
    const hasData = headerLower.includes("data");
    const hasLancamento =
      headerLower.includes("lançamento") || headerLower.includes("lancamento");
    const hasValor = headerLower.includes("valor");

    if (hasData && hasLancamento && hasValor) {
      return ITAU_FORMAT;
    }

    // Inter: semicolon, columns "Data", "Descrição" / "descricao", "Valor"
    const hasDescricao =
      headerLower.includes("descrição") || headerLower.includes("descricao");
    if (hasData && hasDescricao && hasValor) {
      return INTER_FORMAT;
    }
  }

  // Try to detect by data patterns in the second line
  if (lines.length >= 2) {
    const dataLine = lines[1];

    // Check for YYYY-MM-DD pattern (Nubank)
    if (/^\d{4}-\d{2}-\d{2}/.test(dataLine)) {
      return NUBANK_FORMAT;
    }

    // Check for DD/MM/YYYY with semicolon
    const fields = dataLine.split(";");
    if (fields.length >= 3 && /^\d{2}\/\d{2}\/\d{4}$/.test(fields[0].trim())) {
      // Distinguish Itaú vs Inter by checking if amount uses comma decimal
      return ITAU_FORMAT;
    }
  }

  return null;
}

export { NUBANK_FORMAT, ITAU_FORMAT, INTER_FORMAT };
