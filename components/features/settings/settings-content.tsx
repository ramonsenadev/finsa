"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncomeTab, type IncomeRow } from "./income-tab";
import { InvestmentTab, type InvestmentRow } from "./investment-tab";
import { PreferencesTab } from "./preferences-tab";

interface SettingsContentProps {
  incomes: IncomeRow[];
  investments: InvestmentRow[];
  totalIncome: number;
  recurringTolerance: number;
}

export function SettingsContent({
  incomes,
  investments,
  totalIncome,
  recurringTolerance,
}: SettingsContentProps) {
  return (
    <Tabs defaultValue="income">
      <TabsList>
        <TabsTrigger value="income">Renda</TabsTrigger>
        <TabsTrigger value="investments">Investimentos</TabsTrigger>
        <TabsTrigger value="csv-formats" disabled>
          Formatos CSV
        </TabsTrigger>
        <TabsTrigger value="preferences">Preferências</TabsTrigger>
      </TabsList>

      <TabsContent value="income" className="mt-6">
        <IncomeTab incomes={incomes} />
      </TabsContent>

      <TabsContent value="investments" className="mt-6">
        <InvestmentTab investments={investments} totalIncome={totalIncome} />
      </TabsContent>

      <TabsContent value="csv-formats" className="mt-6">
        <div className="rounded-md border border-border p-8 text-center text-foreground-secondary">
          Formatos CSV será implementado em breve.
        </div>
      </TabsContent>

      <TabsContent value="preferences" className="mt-6">
        <PreferencesTab initialTolerance={recurringTolerance} />
      </TabsContent>
    </Tabs>
  );
}
