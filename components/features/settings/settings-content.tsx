"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncomeTab, type IncomeRow } from "./income-tab";
import { InvestmentTab, type InvestmentRow } from "./investment-tab";
import { CsvFormatsTab } from "./csv-formats-tab";
import { PreferencesTab } from "./preferences-tab";
import { CategorizationRulesTab } from "./categorization-rules-tab";
import { DataTab } from "./data-tab";
import type { CsvFormatRow, CategorizationRuleRow } from "@/app/settings/actions";

interface SettingsContentProps {
  incomes: IncomeRow[];
  investments: InvestmentRow[];
  totalIncome: number;
  recurringTolerance: number;
  csvFormats: CsvFormatRow[];
  categorizationRules: CategorizationRuleRow[];
  categories: { id: string; name: string; isParent: boolean }[];
}

export function SettingsContent({
  incomes,
  investments,
  totalIncome,
  recurringTolerance,
  csvFormats,
  categorizationRules,
  categories,
}: SettingsContentProps) {
  return (
    <Tabs defaultValue="income">
      <TabsList>
        <TabsTrigger value="income">Renda</TabsTrigger>
        <TabsTrigger value="investments">Investimentos</TabsTrigger>
        <TabsTrigger value="csv-formats">Formatos CSV</TabsTrigger>
        <TabsTrigger value="preferences">Preferências</TabsTrigger>
        <TabsTrigger value="rules">Regras</TabsTrigger>
        <TabsTrigger value="data">Dados</TabsTrigger>
      </TabsList>

      <TabsContent value="income" className="mt-6">
        <IncomeTab incomes={incomes} />
      </TabsContent>

      <TabsContent value="investments" className="mt-6">
        <InvestmentTab investments={investments} totalIncome={totalIncome} />
      </TabsContent>

      <TabsContent value="csv-formats" className="mt-6">
        <CsvFormatsTab formats={csvFormats} />
      </TabsContent>

      <TabsContent value="preferences" className="mt-6">
        <PreferencesTab initialTolerance={recurringTolerance} />
      </TabsContent>

      <TabsContent value="rules" className="mt-6">
        <CategorizationRulesTab rules={categorizationRules} categories={categories} />
      </TabsContent>

      <TabsContent value="data" className="mt-6">
        <DataTab />
      </TabsContent>
    </Tabs>
  );
}
