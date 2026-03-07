export function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, " ");
}

const INSTALLMENT_PATTERN = /\s*-?\s*parcela\s+\d+\/\d+$/i;
const INSTALLMENT_PATTERN_SHORT = /\s+\d+\/\d+$/;
const DISCOUNT_PREFIX = /^desconto\s+(de\s+)?antecipa[cç][aã]o\s*-?\s*/i;

export function extractMerchant(title: string): string {
  let merchant = title.trim();

  // Remove installment suffixes: "- Parcela 2/2", "Parcela 3/10", "2/2"
  merchant = merchant.replace(INSTALLMENT_PATTERN, "");
  merchant = merchant.replace(INSTALLMENT_PATTERN_SHORT, "");

  // Remove discount prefixes
  merchant = merchant.replace(DISCOUNT_PREFIX, "");

  return merchant.trim();
}
