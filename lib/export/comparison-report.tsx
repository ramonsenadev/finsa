import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type {
  TemporalComparisonData,
  ComparisonCategory,
} from "@/lib/analytics/temporal-comparison";
import type { InvestmentEvolutionData } from "@/lib/analytics/investment-evolution";

// ─── Types ──────────────────────────────────────────────────────────

export interface ComparisonReportProps {
  comparison: TemporalComparisonData;
  investments: InvestmentEvolutionData;
  periodLabel: string; // "Dez 2025 — Mar 2026"
  generatedAt: string; // "09/03/2026 às 14:30"
}

// ─── Font Registration ──────────────────────────────────────────────

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf", fontWeight: 700 },
  ],
});

// ─── Colors ─────────────────────────────────────────────────────────

const colors = {
  accent: "#6366F1",
  accentLight: "#EEF2FF",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  recurring: "#8B5CF6",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  bgMuted: "#F9FAFB",
};

// ─── Styles ─────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9,
    color: colors.text,
    backgroundColor: colors.bg,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
  },

  // Cover
  coverHeader: {
    backgroundColor: colors.accent,
    marginTop: -40,
    marginHorizontal: -40,
    paddingVertical: 32,
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  coverTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#FFFFFF",
  },
  coverSubtitle: {
    fontSize: 12,
    fontWeight: 400,
    color: "#C7D2FE",
    marginTop: 4,
  },
  coverDate: {
    fontSize: 9,
    color: "#C7D2FE",
    marginTop: 8,
  },

  // Indicator Cards
  indicatorRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  indicatorCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
  },
  indicatorLabel: {
    fontSize: 8,
    fontWeight: 500,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  indicatorValue: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
  },
  indicatorSub: {
    fontSize: 8,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },

  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.bgMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRowHighlight: {
    backgroundColor: colors.errorBg,
  },
  tableRowSuccess: {
    backgroundColor: colors.successBg,
  },
  tableCellHeader: {
    fontSize: 7.5,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  tableCell: {
    fontSize: 8.5,
    color: colors.text,
  },
  tableCellRight: {
    fontSize: 8.5,
    color: colors.text,
    textAlign: "right",
  },
  tableCellBold: {
    fontSize: 8.5,
    color: colors.text,
    fontWeight: 600,
  },

  // Subtotal
  subtotalRow: {
    flexDirection: "row",
    backgroundColor: colors.accentLight,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  subtotalLabel: {
    fontSize: 8.5,
    fontWeight: 600,
    color: colors.accent,
  },

  // Sub-row (indented)
  subRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.bgMuted,
  },

  // Growth list
  growthItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Summary box
  summaryBox: {
    backgroundColor: colors.bgMuted,
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
  },
  summaryText: {
    fontSize: 9,
    color: colors.textSecondary,
  },

  // Footer
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 40,
    fontSize: 7,
    color: colors.textSecondary,
  },
});

// ─── Helpers ────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatPercentAbs(value: number | null): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

function trendLabel(trend: "up" | "down" | "stable"): string {
  switch (trend) {
    case "up": return "crescente";
    case "down": return "decrescente";
    case "stable": return "estável";
  }
}

function trendColor(trend: "up" | "down" | "stable"): string {
  switch (trend) {
    case "up": return colors.error;
    case "down": return colors.success;
    case "stable": return colors.textSecondary;
  }
}

function isHighGrowth(cat: ComparisonCategory): boolean {
  return cat.deltaPercent != null && cat.deltaPercent > 20;
}

const MONTH_NAMES_SHORT: Record<number, string> = {
  1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
  7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
};

function formatMonthShort(monthRef: string): string {
  const [year, month] = monthRef.split("-").map(Number);
  return `${MONTH_NAMES_SHORT[month]} ${year}`;
}

// ─── Page 1: Cover & Summary ────────────────────────────────────────

function CoverPage({
  comparison,
  periodLabel,
  generatedAt,
}: {
  comparison: TemporalComparisonData;
  periodLabel: string;
  generatedAt: string;
}) {
  // Compute average monthly spending
  const monthlyTotals = comparison.months.map((m) => {
    return comparison.categories.reduce((sum, cat) => {
      const mv = cat.monthlyValues.find((v) => v.monthRef === m);
      return sum + (mv?.total ?? 0);
    }, 0);
  });
  const avgMonthly = monthlyTotals.length > 0
    ? monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length
    : 0;

  // Overall trend
  const firstTotal = monthlyTotals[0] ?? 0;
  const lastTotal = monthlyTotals[monthlyTotals.length - 1] ?? 0;
  const overallTrend = firstTotal === 0 && lastTotal === 0
    ? "stable" as const
    : firstTotal === 0
      ? "up" as const
      : ((lastTotal - firstTotal) / firstTotal) > 0.05
        ? "up" as const
        : ((lastTotal - firstTotal) / firstTotal) < -0.05
          ? "down" as const
          : "stable" as const;

  const overallTrendLabel = overallTrend === "up"
    ? "Gastos subindo"
    : overallTrend === "down"
      ? "Gastos descendo"
      : "Gastos estáveis";

  // Top growing categories
  const growingCats = comparison.categories
    .filter((c) => isHighGrowth(c))
    .sort((a, b) => (b.deltaPercent ?? 0) - (a.deltaPercent ?? 0))
    .slice(0, 5);

  return (
    <Page size="A4" style={s.page}>
      <View style={s.coverHeader}>
        <Text style={s.coverTitle}>Finsa — Relatório Comparativo</Text>
        <Text style={s.coverSubtitle}>{periodLabel}</Text>
        <Text style={s.coverDate}>Gerado em {generatedAt}</Text>
      </View>

      {/* Summary cards */}
      <View style={s.indicatorRow}>
        <View style={s.indicatorCard}>
          <Text style={s.indicatorLabel}>Média Mensal de Gastos</Text>
          <Text style={s.indicatorValue}>{formatBRL(avgMonthly)}</Text>
          <Text style={s.indicatorSub}>
            {comparison.months.length} meses no período
          </Text>
        </View>
        <View style={s.indicatorCard}>
          <Text style={s.indicatorLabel}>Tendência Geral</Text>
          <Text style={[s.indicatorValue, { color: trendColor(overallTrend), fontSize: 14 }]}>
            {overallTrendLabel}
          </Text>
          {firstTotal > 0 && (
            <Text style={s.indicatorSub}>
              {formatMonthShort(comparison.startMonth)}: {formatBRL(firstTotal)} → {formatMonthShort(comparison.endMonth)}: {formatBRL(lastTotal)}
            </Text>
          )}
        </View>
      </View>

      <View style={s.indicatorRow}>
        <View style={s.indicatorCard}>
          <Text style={s.indicatorLabel}>Categorias Analisadas</Text>
          <Text style={s.indicatorValue}>{comparison.categories.length}</Text>
          <Text style={s.indicatorSub}>categorias com movimentação</Text>
        </View>
        <View style={s.indicatorCard}>
          <Text style={s.indicatorLabel}>Crescimento {">"} 20%</Text>
          <Text style={[s.indicatorValue, { color: growingCats.length > 0 ? colors.error : colors.success }]}>
            {growingCats.length} {growingCats.length === 1 ? "categoria" : "categorias"}
          </Text>
          <Text style={s.indicatorSub}>requerem atenção</Text>
        </View>
      </View>

      {/* Top growing categories */}
      {growingCats.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={s.sectionTitle}>Categorias com Maior Crescimento</Text>
          {growingCats.map((cat) => (
            <View key={cat.categoryId} style={s.growthItem}>
              <Text style={[s.tableCell, { fontWeight: 500 }]}>
                {cat.icon ? `${cat.icon} ` : ""}{cat.name}
              </Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <Text style={[s.tableCell, { color: colors.textSecondary }]}>
                  {formatBRL(cat.firstMonth)} → {formatBRL(cat.lastMonth)}
                </Text>
                <Text style={[s.tableCellBold, { color: colors.error }]}>
                  {formatPercent(cat.deltaPercent)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {growingCats.length === 0 && (
        <View style={s.summaryBox}>
          <Text style={[s.summaryText, { fontWeight: 600, marginBottom: 4 }]}>Resumo</Text>
          <Text style={s.summaryText}>
            Nenhuma categoria apresentou crescimento superior a 20% no período.
            Os gastos se mantiveram dentro de padrões estáveis.
          </Text>
        </View>
      )}

      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
    </Page>
  );
}

// ─── Page 2: Variation Table ────────────────────────────────────────

function VariationPage({
  comparison,
}: {
  comparison: TemporalComparisonData;
}) {
  // Sort by delta% descending
  const sorted = [...comparison.categories].sort(
    (a, b) => (b.deltaPercent ?? -Infinity) - (a.deltaPercent ?? -Infinity),
  );

  // Top 3 growing categories to expand subcategories
  const top3GrowingIds = new Set(
    sorted
      .filter((c) => isHighGrowth(c))
      .slice(0, 3)
      .map((c) => c.categoryId),
  );

  const cols = {
    name: 110,
    first: 70,
    last: 70,
    delta: 65,
    deltaPct: 55,
    trend: 60,
  };

  const firstLabel = formatMonthShort(comparison.startMonth);
  const lastLabel = formatMonthShort(comparison.endMonth);

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Tabela de Variação por Categoria</Text>

      <View style={s.table}>
        {/* Header */}
        <View style={s.tableHeader}>
          <Text style={[s.tableCellHeader, { width: cols.name }]}>Categoria</Text>
          <Text style={[s.tableCellHeader, { width: cols.first, textAlign: "right" }]}>{firstLabel}</Text>
          <Text style={[s.tableCellHeader, { width: cols.last, textAlign: "right" }]}>{lastLabel}</Text>
          <Text style={[s.tableCellHeader, { width: cols.delta, textAlign: "right" }]}>Delta (R$)</Text>
          <Text style={[s.tableCellHeader, { width: cols.deltaPct, textAlign: "right" }]}>Delta %</Text>
          <Text style={[s.tableCellHeader, { width: cols.trend, textAlign: "right" }]}>Tendência</Text>
        </View>

        {/* Rows */}
        {sorted.map((cat) => {
          const highlight = isHighGrowth(cat);
          const declining = cat.deltaPercent != null && cat.deltaPercent < -20;
          const showSubs = top3GrowingIds.has(cat.categoryId) && cat.subcategories.length > 0;

          return (
            <React.Fragment key={cat.categoryId}>
              <View
                style={[
                  s.tableRow,
                  highlight ? s.tableRowHighlight : {},
                  declining ? s.tableRowSuccess : {},
                ]}
              >
                <Text style={[
                  highlight ? s.tableCellBold : s.tableCell,
                  { width: cols.name, fontWeight: 500 },
                ]}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </Text>
                <Text style={[s.tableCellRight, { width: cols.first }]}>
                  {formatBRL(cat.firstMonth)}
                </Text>
                <Text style={[s.tableCellRight, { width: cols.last }]}>
                  {formatBRL(cat.lastMonth)}
                </Text>
                <Text style={[
                  s.tableCellRight,
                  {
                    width: cols.delta,
                    color: cat.deltaAbsolute > 0 ? colors.error : cat.deltaAbsolute < 0 ? colors.success : colors.text,
                    fontWeight: highlight ? 600 : 400,
                  },
                ]}>
                  {cat.deltaAbsolute >= 0 ? "+" : ""}{formatBRL(cat.deltaAbsolute)}
                </Text>
                <Text style={[
                  s.tableCellRight,
                  {
                    width: cols.deltaPct,
                    color: highlight ? colors.error : cat.trend === "down" ? colors.success : colors.text,
                    fontWeight: highlight ? 600 : 400,
                  },
                ]}>
                  {formatPercent(cat.deltaPercent)}
                </Text>
                <Text style={[
                  s.tableCellRight,
                  { width: cols.trend, color: trendColor(cat.trend) },
                ]}>
                  {trendLabel(cat.trend)}
                </Text>
              </View>

              {/* Expanded subcategories for top 3 growing */}
              {showSubs && cat.subcategories.map((sub) => (
                <View key={sub.categoryId} style={s.subRow}>
                  <Text style={[s.tableCell, { width: cols.name, paddingLeft: 12, color: colors.textSecondary }]}>
                    {sub.icon ? `${sub.icon} ` : ""}↳ {sub.name}
                  </Text>
                  <Text style={[s.tableCellRight, { width: cols.first, color: colors.textSecondary }]}>
                    {formatBRL(sub.firstMonth)}
                  </Text>
                  <Text style={[s.tableCellRight, { width: cols.last, color: colors.textSecondary }]}>
                    {formatBRL(sub.lastMonth)}
                  </Text>
                  <Text style={[
                    s.tableCellRight,
                    {
                      width: cols.delta,
                      color: sub.deltaAbsolute > 0 ? colors.error : sub.deltaAbsolute < 0 ? colors.success : colors.textSecondary,
                    },
                  ]}>
                    {sub.deltaAbsolute >= 0 ? "+" : ""}{formatBRL(sub.deltaAbsolute)}
                  </Text>
                  <Text style={[
                    s.tableCellRight,
                    {
                      width: cols.deltaPct,
                      color: isHighGrowth(sub) ? colors.error : colors.textSecondary,
                    },
                  ]}>
                    {formatPercent(sub.deltaPercent)}
                  </Text>
                  <Text style={[s.tableCellRight, { width: cols.trend, color: trendColor(sub.trend) }]}>
                    {trendLabel(sub.trend)}
                  </Text>
                </View>
              ))}
            </React.Fragment>
          );
        })}
      </View>

      {/* Legend */}
      <View style={s.summaryBox}>
        <Text style={s.summaryText}>
          Categorias com crescimento {"> "}20% estão destacadas em vermelho.
          Subcategorias expandidas para as top 3 categorias em crescimento.
        </Text>
      </View>

      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
    </Page>
  );
}

// ─── Page 3: Investments ────────────────────────────────────────────

function InvestmentPage({
  investments,
  comparison,
  generatedAt,
}: {
  investments: InvestmentEvolutionData;
  comparison: TemporalComparisonData;
  generatedAt: string;
}) {
  const { months, breakdown, currentTotal } = investments;

  // Filter investment months that fall within comparison period
  const periodMonths = months.filter(
    (m) => m.monthRef >= comparison.startMonth && m.monthRef <= comparison.endMonth,
  );

  const totalInvested = periodMonths.reduce((sum, m) => sum + m.amount, 0);
  const cols = { type: 150, value: 90, pct: 70 };

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Investimentos no Período</Text>

      {/* Summary */}
      <View style={s.indicatorRow}>
        <View style={s.indicatorCard}>
          <Text style={s.indicatorLabel}>Total Investido no Período</Text>
          <Text style={s.indicatorValue}>{formatBRL(totalInvested)}</Text>
          <Text style={s.indicatorSub}>
            soma de {periodMonths.length} meses
          </Text>
        </View>
        <View style={s.indicatorCard}>
          <Text style={s.indicatorLabel}>Posição Atual</Text>
          <Text style={s.indicatorValue}>{formatBRL(currentTotal)}</Text>
          {investments.percentOfIncome != null && (
            <Text style={s.indicatorSub}>
              {formatPercentAbs(investments.percentOfIncome)} da renda
            </Text>
          )}
        </View>
      </View>

      {/* Monthly evolution */}
      {periodMonths.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[s.sectionTitle, { fontSize: 11 }]}>
            Evolução Mensal — % da Renda Investido
          </Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.tableCellHeader, { flex: 1 }]}>Mês</Text>
              <Text style={[s.tableCellHeader, { width: 90, textAlign: "right" }]}>Valor (R$)</Text>
              <Text style={[s.tableCellHeader, { width: 70, textAlign: "right" }]}>% Renda</Text>
            </View>
            {periodMonths.map((m) => (
              <View key={m.monthRef} style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1 }]}>{formatMonthShort(m.monthRef)}</Text>
                <Text style={[s.tableCellRight, { width: 90 }]}>{formatBRL(m.amount)}</Text>
                <Text style={[s.tableCellRight, { width: 70 }]}>
                  {formatPercentAbs(m.percentOfIncome)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Breakdown by type */}
      {breakdown.length > 0 && (
        <View>
          <Text style={[s.sectionTitle, { fontSize: 11 }]}>
            Breakdown por Tipo
          </Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.tableCellHeader, { width: cols.type }]}>Tipo</Text>
              <Text style={[s.tableCellHeader, { width: cols.value, textAlign: "right" }]}>Valor (R$)</Text>
              <Text style={[s.tableCellHeader, { width: cols.pct, textAlign: "right" }]}>% do Total</Text>
            </View>
            {breakdown.map((item) => (
              <View key={item.category} style={s.tableRow}>
                <Text style={[s.tableCell, { width: cols.type, fontWeight: 500 }]}>{item.label}</Text>
                <Text style={[s.tableCellRight, { width: cols.value }]}>{formatBRL(item.amount)}</Text>
                <Text style={[s.tableCellRight, { width: cols.pct }]}>{formatPercentAbs(item.percent)}</Text>
              </View>
            ))}
            <View style={s.subtotalRow}>
              <Text style={[s.subtotalLabel, { width: cols.type }]}>Total</Text>
              <Text style={[s.subtotalLabel, { width: cols.value, textAlign: "right" }]}>{formatBRL(currentTotal)}</Text>
              <Text style={[s.subtotalLabel, { width: cols.pct, textAlign: "right" }]}>100.0%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Footer note */}
      <View style={[s.summaryBox, { marginTop: "auto" }]}>
        <Text style={[s.summaryText, { textAlign: "center" }]}>
          Gerado pelo Finsa em {generatedAt}
        </Text>
      </View>

      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
    </Page>
  );
}

// ─── Main Document ──────────────────────────────────────────────────

export function ComparisonReport({
  comparison,
  investments,
  periodLabel,
  generatedAt,
}: ComparisonReportProps) {
  const hasInvestments = investments.currentTotal > 0 || investments.breakdown.length > 0;

  return (
    <Document
      title={`Finsa — Relatório Comparativo — ${periodLabel}`}
      author="Finsa"
      subject={`Relatório comparativo de ${periodLabel}`}
    >
      <CoverPage
        comparison={comparison}
        periodLabel={periodLabel}
        generatedAt={generatedAt}
      />
      <VariationPage comparison={comparison} />
      {hasInvestments && (
        <InvestmentPage
          investments={investments}
          comparison={comparison}
          generatedAt={generatedAt}
        />
      )}
    </Document>
  );
}
