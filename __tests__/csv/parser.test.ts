import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { parseCsv, extractInstallment, parseAmount } from "@/lib/csv/parser";
import { NUBANK_FORMAT, ITAU_FORMAT, INTER_FORMAT } from "@/lib/csv/format-detector";

const fixturesDir = path.resolve(__dirname, "../fixtures");

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), "utf-8");
}

describe("parseCsv", () => {
  describe("Nubank format", () => {
    it("parses all valid transactions", () => {
      const csv = readFixture("nubank.csv");
      const result = parseCsv(csv, NUBANK_FORMAT);

      expect(result.transactions).toHaveLength(10);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.parsed).toBe(10);
      expect(result.stats.skipped).toBe(0);
    });

    it("parses dates correctly in YYYY-MM-DD format", () => {
      const csv = readFixture("nubank.csv");
      const result = parseCsv(csv, NUBANK_FORMAT);

      const first = result.transactions[0];
      expect(first.date.getFullYear()).toBe(2025);
      expect(first.date.getMonth()).toBe(0); // January
      expect(first.date.getDate()).toBe(2);
    });

    it("parses amounts with dot decimal separator", () => {
      const csv = readFixture("nubank.csv");
      const result = parseCsv(csv, NUBANK_FORMAT);

      expect(result.transactions[0].amount).toBe(32.9);
      expect(result.transactions[1].amount).toBe(187.43);
    });

    it("parses negative amounts (credits)", () => {
      const csv = readFixture("nubank.csv");
      const result = parseCsv(csv, NUBANK_FORMAT);

      const antecipacao = result.transactions[7];
      expect(antecipacao.amount).toBe(-12.99);
      expect(antecipacao.originalTitle).toBe("Desconto Antecipacao Amazon");

      const pagamento = result.transactions[9];
      expect(pagamento.amount).toBe(-7844.64);
    });

    it("flags bill payments with isPayment", () => {
      const csv = readFixture("nubank.csv");
      const result = parseCsv(csv, NUBANK_FORMAT);

      // "Pagamento recebido" is a bill payment
      const pagamento = result.transactions[9];
      expect(pagamento.originalTitle).toBe("Pagamento recebido");
      expect(pagamento.isPayment).toBe(true);

      // Regular transactions are not payments
      const regular = result.transactions[0];
      expect(regular.isPayment).toBe(false);

      // Refunds/discounts are not payments
      const antecipacao = result.transactions[7];
      expect(antecipacao.isPayment).toBe(false);
    });

    it("extracts installments from title", () => {
      const csv = readFixture("nubank.csv");
      const result = parseCsv(csv, NUBANK_FORMAT);

      const amazon = result.transactions[3];
      expect(amazon.originalTitle).toBe("Amazon Mktplace - Parcela 2/5");
      expect(amazon.description).toBe("Amazon Mktplace");
      expect(amazon.installmentCurrent).toBe(2);
      expect(amazon.installmentTotal).toBe(5);

      const ferreira = result.transactions[8];
      expect(ferreira.description).toBe("Ferreira Costa");
      expect(ferreira.installmentCurrent).toBe(1);
      expect(ferreira.installmentTotal).toBe(3);
    });

    it("does not extract installments from non-installment titles", () => {
      const csv = readFixture("nubank.csv");
      const result = parseCsv(csv, NUBANK_FORMAT);

      const netflix = result.transactions[2];
      expect(netflix.description).toBe("Netflix.Com");
      expect(netflix.installmentCurrent).toBeUndefined();
      expect(netflix.installmentTotal).toBeUndefined();
    });

    it("computes date range correctly", () => {
      const csv = readFixture("nubank.csv");
      const result = parseCsv(csv, NUBANK_FORMAT);

      expect(result.stats.dateRange).not.toBeNull();
      expect(result.stats.dateRange!.from.getDate()).toBe(2);
      expect(result.stats.dateRange!.to.getDate()).toBe(25);
    });
  });

  describe("Itaú format", () => {
    it("parses semicolon-delimited CSV with DD/MM/YYYY dates", () => {
      const csv = readFixture("itau.csv");
      const result = parseCsv(csv, ITAU_FORMAT);

      expect(result.transactions).toHaveLength(10);
      expect(result.errors).toHaveLength(0);
    });

    it("parses DD/MM/YYYY dates correctly", () => {
      const csv = readFixture("itau.csv");
      const result = parseCsv(csv, ITAU_FORMAT);

      const first = result.transactions[0];
      expect(first.date.getFullYear()).toBe(2025);
      expect(first.date.getMonth()).toBe(0);
      expect(first.date.getDate()).toBe(2);
    });

    it("parses amounts with comma decimal separator (pt-BR)", () => {
      const csv = readFixture("itau.csv");
      const result = parseCsv(csv, ITAU_FORMAT);

      expect(result.transactions[0].amount).toBe(187.43);
      expect(result.transactions[1].amount).toBe(22.5);
    });

    it("handles R$ prefix in amounts", () => {
      const csv = readFixture("itau.csv");
      const result = parseCsv(csv, ITAU_FORMAT);

      // Amazon with R$ prefix
      const amazon = result.transactions[3];
      expect(amazon.amount).toBe(259.9);
    });

    it("handles negative amounts with thousand separator", () => {
      const csv = readFixture("itau.csv");
      const result = parseCsv(csv, ITAU_FORMAT);

      const pagamento = result.transactions[9];
      expect(pagamento.amount).toBe(-1087.73);
    });

    it("flags Itaú bill payments with isPayment", () => {
      const csv = readFixture("itau.csv");
      const result = parseCsv(csv, ITAU_FORMAT);

      const pagamento = result.transactions[9];
      expect(pagamento.originalTitle).toBe("PAGAMENTO FATURA");
      expect(pagamento.isPayment).toBe(true);

      expect(result.transactions[0].isPayment).toBe(false);
    });

    it("extracts installments from Itaú format", () => {
      const csv = readFixture("itau.csv");
      const result = parseCsv(csv, ITAU_FORMAT);

      const amazon = result.transactions[3];
      expect(amazon.installmentCurrent).toBe(1);
      expect(amazon.installmentTotal).toBe(3);
      expect(amazon.description).toBe("AMAZON MKTPLACE");
    });
  });

  describe("Inter format", () => {
    it("parses Inter CSV correctly", () => {
      const csv = readFixture("inter.csv");
      const result = parseCsv(csv, INTER_FORMAT);

      expect(result.transactions).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.transactions[0].description).toBe("MERCADO LIVRE");
      expect(result.transactions[0].amount).toBe(145.9);
    });
  });

  describe("edge cases", () => {
    it("skips rows with invalid dates (metadata/footer)", () => {
      const csv = `date,title,amount
2025-01-02,Compra teste,10.00
Total,,100.00
,,
2025-01-03,Outra compra,20.00`;

      const result = parseCsv(csv, NUBANK_FORMAT);
      expect(result.transactions).toHaveLength(2);
      expect(result.stats.skipped).toBe(2);
    });

    it("returns empty result for empty CSV", () => {
      const csv = `date,title,amount`;
      const result = parseCsv(csv, NUBANK_FORMAT);

      expect(result.transactions).toHaveLength(0);
      expect(result.stats.dateRange).toBeNull();
    });

    it("preserves rawLine from original data", () => {
      const csv = readFixture("nubank.csv");
      const result = parseCsv(csv, NUBANK_FORMAT);

      expect(result.transactions[0].rawLine).toContain("Ifd*Ifood");
    });
  });
});

describe("extractInstallment", () => {
  it("extracts installment from standard format", () => {
    const result = extractInstallment("Amazon - Parcela 2/5");
    expect(result.description).toBe("Amazon");
    expect(result.installmentCurrent).toBe(2);
    expect(result.installmentTotal).toBe(5);
  });

  it("handles double-digit installments", () => {
    const result = extractInstallment("Loja ABC - Parcela 10/12");
    expect(result.installmentCurrent).toBe(10);
    expect(result.installmentTotal).toBe(12);
  });

  it("returns original title when no installment", () => {
    const result = extractInstallment("Netflix.Com");
    expect(result.description).toBe("Netflix.Com");
    expect(result.installmentCurrent).toBeUndefined();
  });

  it("does not match partial installment patterns", () => {
    const result = extractInstallment("Parcela 1/2 Loja");
    expect(result.description).toBe("Parcela 1/2 Loja");
    expect(result.installmentCurrent).toBeUndefined();
  });
});

describe("parseAmount", () => {
  it("parses en locale (dot decimal)", () => {
    expect(parseAmount("32.90", "en")).toBe(32.9);
    expect(parseAmount("-12.99", "en")).toBe(-12.99);
  });

  it("parses pt-BR locale (comma decimal)", () => {
    expect(parseAmount("187,43", "pt-BR")).toBe(187.43);
    expect(parseAmount("-1.087,73", "pt-BR")).toBe(-1087.73);
  });

  it("strips R$ prefix", () => {
    expect(parseAmount("R$ 259,90", "pt-BR")).toBe(259.9);
    expect(parseAmount("R$259,90", "pt-BR")).toBe(259.9);
  });

  it("returns null for invalid values", () => {
    expect(parseAmount("", "en")).toBeNull();
    expect(parseAmount("abc", "en")).toBeNull();
  });
});
