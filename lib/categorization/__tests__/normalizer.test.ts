import { describe, it, expect } from "vitest";
import { normalizeTitle, extractMerchant } from "../normalizer";

describe("normalizeTitle", () => {
  it("lowercases and trims", () => {
    expect(normalizeTitle("  G Barbosa  ")).toBe("g barbosa");
  });

  it("collapses double spaces", () => {
    expect(normalizeTitle("Amazon  Marketplace")).toBe("amazon marketplace");
  });

  it("handles already normalized input", () => {
    expect(normalizeTitle("netflix")).toBe("netflix");
  });
});

describe("extractMerchant", () => {
  it("removes 'Parcela X/Y' suffix", () => {
    expect(extractMerchant("Amazon Marketplace - Parcela 2/2")).toBe(
      "Amazon Marketplace"
    );
  });

  it("removes short installment suffix '3/10'", () => {
    expect(extractMerchant("Casas Bahia 3/10")).toBe("Casas Bahia");
  });

  it("removes discount prefix", () => {
    expect(
      extractMerchant("Desconto Antecipação - Amazon Marketplace")
    ).toBe("Amazon Marketplace");
  });

  it("handles title with no installment or discount", () => {
    expect(extractMerchant("Netflix.Com")).toBe("Netflix.Com");
  });

  it("removes 'Desconto de Antecipação' prefix variant", () => {
    expect(extractMerchant("Desconto de Antecipação - Shopee")).toBe("Shopee");
  });
});
