import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getMonthlyDashboard } from "@/lib/analytics/dashboard";
import { getInvestmentEvolution } from "@/lib/analytics/investment-evolution";
import { MonthlyReport } from "@/lib/export/monthly-report";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatMonthLabel(monthRef: string): string {
  const [year, month] = monthRef.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function formatGeneratedAt(): string {
  const now = new Date();
  const date = now.toLocaleDateString("pt-BR");
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} às ${time}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const monthRef = searchParams.get("month");
  const userEmail = searchParams.get("user") || "ramon@finsa.local";

  if (!monthRef || !/^\d{4}-\d{2}$/.test(monthRef)) {
    return NextResponse.json(
      { error: "Parâmetro 'month' obrigatório no formato YYYY-MM" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({ where: { email: userEmail } });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  // Fetch data in parallel (topN=15 for PDF)
  const [dashboard, investments] = await Promise.all([
    getMonthlyDashboard(user.id, monthRef, "all", 15),
    getInvestmentEvolution(user.id, monthRef, 1),
  ]);

  const monthLabel = formatMonthLabel(monthRef);
  const generatedAt = formatGeneratedAt();

  const buffer = await renderToBuffer(
    <MonthlyReport
      dashboard={dashboard}
      investments={investments}
      monthLabel={monthLabel}
      generatedAt={generatedAt}
    />
  );

  const filename = `finsa-relatorio-${monthRef}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
