import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { MonthlyDashboardData, CategoryBreakdown, TopExpense } from "@/lib/analytics/dashboard";
import type { InvestmentEvolutionData } from "@/lib/analytics/investment-evolution";

// ─── Types ──────────────────────────────────────────────────────────

export interface MonthlyReportProps {
  dashboard: MonthlyDashboardData;
  investments: InvestmentEvolutionData;
  monthLabel: string; // "Março 2026"
  generatedAt: string; // "08/03/2026 às 14:30"
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
  warning: "#F59E0B",
  error: "#EF4444",
  recurring: "#8B5CF6",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  bgMuted: "#F9FAFB",
  errorBg: "#FEF2F2",
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
    marginBottom: 24,
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
  indicatorDelta: {
    fontSize: 8,
    marginTop: 2,
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

  // Subtotals
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

  // Top expenses
  positionCell: {
    width: 24,
    textAlign: "center",
    fontWeight: 600,
  },

  // Recurring badge
  recurringBadge: {
    fontSize: 7,
    color: colors.recurring,
    fontWeight: 500,
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
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: colors.textSecondary,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
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

function deltaPercent(current: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function deltaColor(delta: number | null, invertGreen = false): string {
  if (delta == null) return colors.textSecondary;
  const positive = delta >= 0;
  if (invertGreen) return positive ? colors.error : colors.success;
  return positive ? colors.success : colors.error;
}

function formatDateShort(date: Date): string {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Page 1: Cover & Indicators ─────────────────────────────────────

function CoverPage({ dashboard, monthLabel, generatedAt }: {
  dashboard: MonthlyDashboardData;
  monthLabel: string;
  generatedAt: string;
}) {
  const {
    totalIncome, totalExpenses, totalInvestments, freeBalance,
    prevTotalIncome, prevTotalExpenses, prevTotalInvestments, prevFreeBalance,
    hasIncome,
  } = dashboard;

  const indicators = [
    {
      label: "Renda Total",
      value: totalIncome,
      percent: null as number | null,
      delta: deltaPercent(totalIncome, prevTotalIncome),
      invertDelta: false,
    },
    {
      label: "Total Gastos",
      value: totalExpenses,
      percent: hasIncome && totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : null,
      delta: deltaPercent(totalExpenses, prevTotalExpenses),
      invertDelta: true,
    },
    {
      label: "Total Investido",
      value: totalInvestments,
      percent: hasIncome && totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : null,
      delta: deltaPercent(totalInvestments, prevTotalInvestments),
      invertDelta: false,
    },
    {
      label: "Saldo Livre",
      value: freeBalance,
      percent: hasIncome && totalIncome > 0 ? (freeBalance / totalIncome) * 100 : null,
      delta: deltaPercent(freeBalance, prevFreeBalance),
      invertDelta: false,
    },
  ];

  return (
    <Page size="A4" style={s.page}>
      {/* Header */}
      <View style={s.coverHeader}>
        <Text style={s.coverTitle}>Finsa — Relatório Mensal</Text>
        <Text style={s.coverSubtitle}>{monthLabel}</Text>
        <Text style={s.coverDate}>Gerado em {generatedAt}</Text>
      </View>

      {/* Indicator Cards — 2 rows of 2 */}
      <View style={s.indicatorRow}>
        {indicators.slice(0, 2).map((ind) => (
          <View key={ind.label} style={s.indicatorCard}>
            <Text style={s.indicatorLabel}>{ind.label}</Text>
            <Text style={s.indicatorValue}>{formatBRL(ind.value)}</Text>
            {ind.percent != null && (
              <Text style={s.indicatorSub}>{formatPercentAbs(ind.percent)} da renda</Text>
            )}
            {ind.delta != null && (
              <Text style={[s.indicatorDelta, { color: deltaColor(ind.delta, ind.invertDelta) }]}>
                {formatPercent(ind.delta)} vs. mês anterior
              </Text>
            )}
          </View>
        ))}
      </View>
      <View style={s.indicatorRow}>
        {indicators.slice(2, 4).map((ind) => (
          <View key={ind.label} style={s.indicatorCard}>
            <Text style={s.indicatorLabel}>{ind.label}</Text>
            <Text style={s.indicatorValue}>{formatBRL(ind.value)}</Text>
            {ind.percent != null && (
              <Text style={s.indicatorSub}>{formatPercentAbs(ind.percent)} da renda</Text>
            )}
            {ind.delta != null && (
              <Text style={[s.indicatorDelta, { color: deltaColor(ind.delta, ind.invertDelta) }]}>
                {formatPercent(ind.delta)} vs. mês anterior
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Quick Summary */}
      <View style={s.summaryBox}>
        <Text style={[s.summaryText, { fontWeight: 600, marginBottom: 4 }]}>Resumo</Text>
        <Text style={s.summaryText}>
          {dashboard.categoryBreakdown.length > 0
            ? `Maior categoria de gasto: ${dashboard.categoryBreakdown[0].name} (${formatBRL(dashboard.categoryBreakdown[0].total)}, ${formatPercentAbs(dashboard.categoryBreakdown[0].percentOfTotal)} do total)`
            : "Nenhuma transação registrada neste mês."}
        </Text>
        {dashboard.topExpenses.length > 0 && (
          <Text style={[s.summaryText, { marginTop: 2 }]}>
            Maior gasto individual: {dashboard.topExpenses[0].description} ({formatBRL(dashboard.topExpenses[0].amount)})
          </Text>
        )}
      </View>

      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
    </Page>
  );
}

// ─── Page 2: Category Distribution ──────────────────────────────────

function CategoryPage({ dashboard }: { dashboard: MonthlyDashboardData }) {
  const { categoryBreakdown, totalExpenses, hasIncome, totalIncome } = dashboard;

  // Split by recurring transactions info (we use budget as proxy)
  const overBudget = (cat: CategoryBreakdown) =>
    cat.budgetAmount != null && cat.total > cat.budgetAmount;

  const catDelta = (cat: CategoryBreakdown): string => {
    if (cat.previousTotal == null) return "—";
    const d = ((cat.total - cat.previousTotal) / cat.previousTotal) * 100;
    return formatPercent(d);
  };

  const budgetStatus = (cat: CategoryBreakdown): string => {
    if (cat.budgetAmount == null) return "—";
    const pct = (cat.total / cat.budgetAmount) * 100;
    return `${pct.toFixed(0)}%`;
  };

  // Column widths
  const cols = { name: 120, value: 70, pctIncome: 55, pctTotal: 55, delta: 60, budget: 55 };

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Distribuição por Categoria</Text>

      <View style={s.table}>
        {/* Header */}
        <View style={s.tableHeader}>
          <Text style={[s.tableCellHeader, { width: cols.name }]}>Categoria</Text>
          <Text style={[s.tableCellHeader, { width: cols.value, textAlign: "right" }]}>Valor (R$)</Text>
          <Text style={[s.tableCellHeader, { width: cols.pctIncome, textAlign: "right" }]}>% Renda</Text>
          <Text style={[s.tableCellHeader, { width: cols.pctTotal, textAlign: "right" }]}>% Total</Text>
          <Text style={[s.tableCellHeader, { width: cols.delta, textAlign: "right" }]}>vs. Anterior</Text>
          <Text style={[s.tableCellHeader, { width: cols.budget, textAlign: "right" }]}>Orçamento</Text>
        </View>

        {/* Rows */}
        {categoryBreakdown.map((cat) => (
          <View
            key={cat.categoryId}
            style={[s.tableRow, overBudget(cat) ? s.tableRowHighlight : {}]}
          >
            <Text style={[s.tableCell, { width: cols.name, fontWeight: 500 }]}>
              {cat.icon ? `${cat.icon} ` : ""}{cat.name}
            </Text>
            <Text style={[s.tableCellRight, { width: cols.value }]}>
              {formatBRL(cat.total)}
            </Text>
            <Text style={[s.tableCellRight, { width: cols.pctIncome }]}>
              {formatPercentAbs(cat.percentOfIncome)}
            </Text>
            <Text style={[s.tableCellRight, { width: cols.pctTotal }]}>
              {formatPercentAbs(cat.percentOfTotal)}
            </Text>
            <Text style={[s.tableCellRight, { width: cols.delta, color: cat.previousTotal != null && cat.total > cat.previousTotal ? colors.error : colors.success }]}>
              {catDelta(cat)}
            </Text>
            <Text style={[s.tableCellRight, { width: cols.budget, color: overBudget(cat) ? colors.error : colors.text }]}>
              {budgetStatus(cat)}
            </Text>
          </View>
        ))}

        {/* Total row */}
        <View style={s.subtotalRow}>
          <Text style={[s.subtotalLabel, { width: cols.name }]}>Total</Text>
          <Text style={[s.subtotalLabel, { width: cols.value, textAlign: "right" }]}>
            {formatBRL(totalExpenses)}
          </Text>
          <Text style={[s.subtotalLabel, { width: cols.pctIncome, textAlign: "right" }]}>
            {hasIncome && totalIncome > 0 ? formatPercentAbs((totalExpenses / totalIncome) * 100) : "—"}
          </Text>
          <Text style={[s.subtotalLabel, { width: cols.pctTotal, textAlign: "right" }]}>100.0%</Text>
          <Text style={[s.subtotalLabel, { width: cols.delta }]} />
          <Text style={[s.subtotalLabel, { width: cols.budget }]} />
        </View>
      </View>

      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
    </Page>
  );
}

// ─── Page 3: Top 15 Expenses ────────────────────────────────────────

function TopExpensesPage({ expenses }: { expenses: TopExpense[] }) {
  const recurring = expenses.filter((e) => e.isRecurring);
  const variable = expenses.filter((e) => !e.isRecurring);
  const recurringTotal = recurring.reduce((sum, e) => sum + e.amount, 0);
  const variableTotal = variable.reduce((sum, e) => sum + e.amount, 0);

  const cols = { pos: 24, date: 42, desc: 180, cat: 100, value: 70 };

  function renderExpenseRow(tx: TopExpense, index: number) {
    return (
      <View key={tx.id} style={s.tableRow}>
        <Text style={[s.tableCell, s.positionCell, { width: cols.pos }]}>{index + 1}</Text>
        <Text style={[s.tableCell, { width: cols.date, color: colors.textSecondary }]}>
          {formatDateShort(tx.date)}
        </Text>
        <Text style={[s.tableCell, { width: cols.desc }]}>
          {tx.description}
        </Text>
        <Text style={[s.tableCell, { width: cols.cat, color: colors.textSecondary }]}>
          {tx.categoryName ?? "Sem categoria"}
        </Text>
        <Text style={[s.tableCellRight, { width: cols.value, fontWeight: 500 }]}>
          {formatBRL(tx.amount)}
        </Text>
      </View>
    );
  }

  // Compute daily averages from variable expenses only (exclude recurring)
  const variableExpenses = expenses.filter((e) => !e.isRecurring);
  const weekdays = variableExpenses.filter((e) => {
    const d = new Date(e.date).getDay();
    return d >= 1 && d <= 5;
  });
  const weekends = variableExpenses.filter((e) => {
    const d = new Date(e.date).getDay();
    return d === 0 || d === 6;
  });
  const weekdayAvg = weekdays.length > 0
    ? weekdays.reduce((sum, e) => sum + e.amount, 0) / weekdays.length
    : 0;
  const weekendAvg = weekends.length > 0
    ? weekends.reduce((sum, e) => sum + e.amount, 0) / weekends.length
    : 0;

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Top 15 Maiores Gastos</Text>

      <View style={s.table}>
        {/* Header */}
        <View style={s.tableHeader}>
          <Text style={[s.tableCellHeader, { width: cols.pos, textAlign: "center" }]}>#</Text>
          <Text style={[s.tableCellHeader, { width: cols.date }]}>Data</Text>
          <Text style={[s.tableCellHeader, { width: cols.desc }]}>Descrição</Text>
          <Text style={[s.tableCellHeader, { width: cols.cat }]}>Categoria</Text>
          <Text style={[s.tableCellHeader, { width: cols.value, textAlign: "right" }]}>Valor</Text>
        </View>

        {/* Recurring section */}
        {recurring.length > 0 && (
          <>
            <View style={[s.tableRow, { backgroundColor: "#F5F3FF" }]}>
              <Text style={[s.tableCell, { fontWeight: 600, color: colors.recurring }]}>
                Recorrentes
              </Text>
            </View>
            {recurring.map((tx, i) => renderExpenseRow(tx, i))}
            <View style={s.subtotalRow}>
              <Text style={[s.subtotalLabel, { flex: 1 }]}>Subtotal Recorrentes</Text>
              <Text style={[s.subtotalLabel, { width: cols.value, textAlign: "right" }]}>
                {formatBRL(recurringTotal)}
              </Text>
            </View>
          </>
        )}

        {/* Variable section */}
        {variable.length > 0 && (
          <>
            <View style={[s.tableRow, { backgroundColor: colors.bgMuted }]}>
              <Text style={[s.tableCell, { fontWeight: 600, color: colors.textSecondary }]}>
                Variáveis
              </Text>
            </View>
            {variable.map((tx, i) => renderExpenseRow(tx, recurring.length + i))}
            <View style={s.subtotalRow}>
              <Text style={[s.subtotalLabel, { flex: 1 }]}>Subtotal Variáveis</Text>
              <Text style={[s.subtotalLabel, { width: cols.value, textAlign: "right" }]}>
                {formatBRL(variableTotal)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Averages */}
      <View style={s.summaryBox}>
        <Text style={s.summaryText}>
          Média dias úteis: {formatBRL(weekdayAvg)}{"  |  "}Média fins de semana: {formatBRL(weekendAvg)}
        </Text>
      </View>

      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
    </Page>
  );
}

// ─── Page 4: Investments (conditional) ──────────────────────────────

function InvestmentPage({ investments, generatedAt }: {
  investments: InvestmentEvolutionData;
  generatedAt: string;
}) {
  const { breakdown, currentTotal, percentOfIncome, hasIncome } = investments;
  const cols = { type: 150, value: 90, pct: 70 };

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Resumo de Investimentos</Text>

      {/* Summary */}
      <View style={[s.indicatorRow, { marginBottom: 16 }]}>
        <View style={s.indicatorCard}>
          <Text style={s.indicatorLabel}>Total Investido</Text>
          <Text style={s.indicatorValue}>{formatBRL(currentTotal)}</Text>
          {hasIncome && percentOfIncome != null && (
            <Text style={s.indicatorSub}>{formatPercentAbs(percentOfIncome)} da renda</Text>
          )}
        </View>
        <View style={s.indicatorCard}>
          <Text style={s.indicatorLabel}>Categorias</Text>
          <Text style={s.indicatorValue}>{breakdown.length}</Text>
          <Text style={s.indicatorSub}>tipos de investimento</Text>
        </View>
      </View>

      {/* Breakdown table */}
      {breakdown.length > 0 && (
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

export function MonthlyReport({ dashboard, investments, monthLabel, generatedAt }: MonthlyReportProps) {
  const hasInvestments = investments.currentTotal > 0 || investments.breakdown.length > 0;

  return (
    <Document
      title={`Finsa — Relatório Mensal — ${monthLabel}`}
      author="Finsa"
      subject={`Relatório financeiro mensal de ${monthLabel}`}
    >
      <CoverPage dashboard={dashboard} monthLabel={monthLabel} generatedAt={generatedAt} />
      <CategoryPage dashboard={dashboard} />
      <TopExpensesPage expenses={dashboard.topExpenses} />
      {hasInvestments && (
        <InvestmentPage investments={investments} generatedAt={generatedAt} />
      )}
    </Document>
  );
}
