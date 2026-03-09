import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getTemporalComparison } from "@/lib/analytics/temporal-comparison";
import { getInvestmentEvolution } from "@/lib/analytics/investment-evolution";
import { ComparisonReport } from "@/lib/export/comparison-report";

const MONTH_NAMES_SHORT: Record<number, string> = {
  1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
  7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
};

function formatPeriodLabel(startMonth: string, endMonth: string): string {
  const [sy, sm] = startMonth.split("-").map(Number);
  const [ey, em] = endMonth.split("-").map(Number);
  return `${MONTH_NAMES_SHORT[sm]} ${sy} — ${MONTH_NAMES_SHORT[em]} ${ey}`;
}

function formatGeneratedAt(): string {
  const now = new Date();
  const date = now.toLocaleDateString("pt-BR");
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} às ${time}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const startMonth = searchParams.get("startMonth");
  const endMonth = searchParams.get("endMonth");
  const userEmail = searchParams.get("user") || "ramon@finsa.local";

  const monthPattern = /^\d{4}-\d{2}$/;

  if (!startMonth || !monthPattern.test(startMonth)) {
    return NextResponse.json(
      { error: "Parâmetro 'startMonth' obrigatório no formato YYYY-MM" },
      { status: 400 },
    );
  }

  if (!endMonth || !monthPattern.test(endMonth)) {
    return NextResponse.json(
      { error: "Parâmetro 'endMonth' obrigatório no formato YYYY-MM" },
      { status: 400 },
    );
  }

  if (startMonth > endMonth) {
    return NextResponse.json(
      { error: "'startMonth' deve ser anterior ou igual a 'endMonth'" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({ where: { email: userEmail } });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  // Compute how many months to fetch for investment evolution
  const [sy, sm] = startMonth.split("-").map(Number);
  const [ey, em] = endMonth.split("-").map(Number);
  const monthCount = (ey - sy) * 12 + (em - sm) + 1;

  const [comparison, investments] = await Promise.all([
    getTemporalComparison(user.id, startMonth, endMonth),
    getInvestmentEvolution(user.id, endMonth, monthCount),
  ]);

  const periodLabel = formatPeriodLabel(startMonth, endMonth);
  const generatedAt = formatGeneratedAt();

  const buffer = await renderToBuffer(
    <ComparisonReport
      comparison={comparison}
      investments={investments}
      periodLabel={periodLabel}
      generatedAt={generatedAt}
    />,
  );

  const filename = `finsa-comparativo-${startMonth}-a-${endMonth}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
