import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  detectFormat,
  NUBANK_FORMAT,
  ITAU_FORMAT,
  INTER_FORMAT,
} from "@/lib/csv/format-detector";

const fixturesDir = path.resolve(__dirname, "../fixtures");

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), "utf-8");
}

describe("detectFormat", () => {
  it("detects Nubank format from header", () => {
    const csv = readFixture("nubank.csv");
    const format = detectFormat(csv);

    expect(format).toEqual(NUBANK_FORMAT);
  });

  it("detects Itaú format from header", () => {
    const csv = readFixture("itau.csv");
    const format = detectFormat(csv);

    expect(format).toEqual(ITAU_FORMAT);
  });

  it("detects Inter format from header", () => {
    const csv = readFixture("inter.csv");
    const format = detectFormat(csv);

    expect(format).toEqual(INTER_FORMAT);
  });

  it("returns null for unrecognizable CSV", () => {
    const csv = "col1,col2,col3\na,b,c";
    const format = detectFormat(csv);

    expect(format).toBeNull();
  });

  it("returns null for empty content", () => {
    expect(detectFormat("")).toBeNull();
    expect(detectFormat("single line")).toBeNull();
  });

  it("detects Nubank by data pattern when header is ambiguous", () => {
    const csv = "d,t,a\n2025-01-02,Netflix,39.90";
    const format = detectFormat(csv);

    expect(format).toEqual(NUBANK_FORMAT);
  });

  it("detects semicolon format by data pattern", () => {
    const csv = "d;t;a\n02/01/2025;NETFLIX;39,90";
    const format = detectFormat(csv);

    expect(format).toEqual(ITAU_FORMAT);
  });
});
