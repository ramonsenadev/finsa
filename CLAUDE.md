# Finsa — Gestão Financeira Familiar

Aplicação web local-first para categorização e análise de gastos familiares. Importa CSVs de cartão de crédito (Nubank, Itaú, Inter), suporta lançamentos manuais, e contextualiza tudo em relação à renda familiar.

## Stack

- **Framework:** Next.js 16.1.6 (App Router, Server Actions, Turbopack)
- **Linguagem:** TypeScript 5.8 (strict mode)
- **Banco:** PostgreSQL 16 (Docker Compose)
- **ORM:** Prisma 6.6
- **UI:** shadcn/ui (new-york style) + Tailwind CSS 4.1 + Radix UI
- **Charts:** Recharts 2.15
- **State:** TanStack Query 5
- **Validação:** Zod 3.24
- **CSV:** Papaparse 5.5
- **Export PDF:** @react-pdf/renderer 4.3
- **Toasts:** Sonner 2
- **Temas:** next-themes 0.4 (light/dark/auto)
- **Icons:** Lucide React
- **IA (opcional):** Anthropic Claude API (Haiku) via @anthropic-ai/sdk

## Comandos

```bash
npm run dev          # Dev server (localhost:3000, Turbopack)
npm run build        # Build de produção
npm run start        # Servir build de produção
npm run lint         # ESLint (0 errors esperado, warnings ok)
npm run test         # Vitest (79 testes)
npm run db:push      # Push schema Prisma (dev rápido)
npm run db:migrate   # Rodar migrations (produção)
npm run db:seed      # Seed categorias, formatos CSV, regras
npm run db:studio    # Prisma Studio (GUI do banco)
```

## Estrutura

```
app/                  # Rotas Next.js App Router
  (dashboard)/        # Dashboard principal (rota raiz /)
  cards/              # CRUD cartões + visão por cartão [cardId]
  transactions/       # Listagem com filtros + review queue
  categories/         # Árvore de categorias
  comparison/         # Comparação temporal entre meses
  import/             # Redirect → /invoices (compatibilidade)
  invoices/           # Hub de faturas (listagem + summary + gráfico)
    import/           # Wizard de importação CSV (3 steps)
  recurring/          # Gastos fixos e recorrentes
  budget/             # Orçamento por categoria
  settings/           # Renda, investimentos, formatos CSV, regras, dados
  api/export/         # API Routes para export PDF (monthly + comparison)
components/
  ui/                 # Design system (shadcn/ui customizado + currency-input, month-selector)
  layout/             # app-shell, sidebar, header
  features/           # Componentes organizados por feature
    cards/            # card-form, card-list, card-detail, card-evolution-chart
    categories/       # category-tree, category-form-modal, icon-picker, color-picker
    comparison/       # evolution-chart, variation-table
    dashboard/        # indicator-cards, category-chart, category-table, daily-chart
    import/           # import-wizard, step-select/preview/processing, manual-mapping
    invoices/         # invoices-content, invoices-table, summary-cards, evolution-chart, status-badge, actions-menu
    recurring/        # recurring-content, edit-recurring-modal, recurring-detection
    review/           # review-queue-table, category-combobox, review-filters
    settings/         # tabs (income, investment, csv-format, rules, preferences, data)
    transactions/     # transaction-table, transaction-filters, category-selector, manual-transaction-modal
lib/
  categorization/     # Pipeline (exact → contains → AI → manual), normalizer, ai-adapter
  csv/                # Parser, format detector (auto-detect delimiter/encoding/date format)
  recurring/          # Detection engine (3+ meses, ±10% tolerância)
  analytics/          # Dashboard queries, temporal comparison
  validations/        # Zod schemas (card, category, income, investment, manual-transaction)
  chart-theme.ts      # Cores dinâmicas para Recharts (light/dark)
  format.ts           # Helpers de formatação (BRL, datas)
  db.ts               # Prisma singleton
  utils.ts            # cn() utility
prisma/               # Schema (12 modelos) e migrations
  seed.ts             # Categorias, formatos CSV, regras de categorização
```

## Convenções de Código

- Português para UI (labels, mensagens, categorias)
- Inglês para código (variáveis, funções, tipos, nomes de arquivo)
- Componentes: functional com hooks, named exports
- Server Actions para mutações; API Routes para operações complexas (export PDF)
- Zod schemas em `lib/validations/` compartilhados entre front e back
- Sempre user_id em todas as tabelas (multi-user ready, sem auth ativa)
- Testes: Vitest para unit tests (categorização, CSV parsing, recorrências)
- Formulários em modals: estado local com useEffect para sync de props (padrão aceito, lint warning)
- Dynamic icon rendering: usar `DynamicIcon` component ao invés de `getIconComponent` direto no render

## Design System

- **Estética:** Notion/Asana-like — limpo, espaçado, tipografia hierárquica
- **Tema:** Suporta claro, escuro e auto (next-themes com class strategy). Todas as cores são via CSS custom properties (--background, --foreground, --border, etc.) mapeadas no Tailwind. NUNCA usar cores hardcoded (ex: text-gray-900, bg-white) — sempre usar tokens semânticos (text-foreground, bg-background, bg-muted, border-border, etc.)
- **Paleta Light:** Background #FFFFFF/#F9FAFB, Text #111827/#6B7280, Accent Indigo #6366F1, Success #10B981, Warning #F59E0B, Error #EF4444, Recurring Violet #8B5CF6
- **Paleta Dark:** Background #0F1117/#1A1D27, Text #F1F2F4/#9CA3AF, Accent Indigo #818CF8, Success #34D399, Warning #FBBF24, Error #F87171, Recurring Violet #A78BFA
- **Font:** Inter, 14px base
- **Spacing:** escala de 4px (4, 8, 12, 16, 24, 32, 48, 64)
- **Border radius:** 8px cards/modais, 6px inputs/botões
- **Layout:** Sidebar 240px collapsible + conteúdo max-width 1200px centralizado

## Regras Importantes

- Categorização segue pipeline: regras exact → contains/regex → IA (fallback) → manual
- Cada categorização manual DEVE gerar CategorizationRule automaticamente
- Recategorização retroativa DEVE oferecer propagação para mesmo estabelecimento
- IA recebe APENAS descrições de transação, nunca valores ou dados pessoais
- MonthSnapshot é on-demand: recalcula quando dashboard é acessado
- Detecção de recorrência: 3+ meses consecutivos, ±10% tolerância (configurável)
- Todos os componentes DEVEM usar classes Tailwind semânticas. Gráficos Recharts usam `getChartColors(resolvedTheme)` de `lib/chart-theme.ts`. Export PDF é sempre estilo claro.

## Gotchas

- **React Compiler (Next.js 16):** Não usar `const Icon = getIconComponent(...)` direto no render — causa erro "Cannot create components during render". Usar o componente `DynamicIcon` de `icon-picker.tsx`.
- **React Compiler refs:** Não acessar `.current` de refs durante render. Se precisa do valor no render, usar useState em vez de useRef.
- **setState em effects:** O React Compiler lint flag `react-hooks/set-state-in-effect` é downgraded para warning no eslint config. Padrão comum e seguro para sync de form state em modals.
- **Tailwind CSS 4:** Usa `@theme` block em `globals.css` em vez de `tailwind.config.ts`. Custom properties definidas lá.
- **Next.js 16 params:** `params` e `searchParams` são async — sempre usar `await`.
- **Prisma seed:** Usa IDs determinísticos (cat-*, fmt-*, rule-*) para idempotência.
- **CurrencyInput:** Componente custom em `components/ui/currency-input.tsx` — aceita valor numérico, formata como BRL (1.234,56).

## Notas Next.js 16

- Turbopack é o bundler padrão (não usar --webpack)
- middleware.ts foi substituído por proxy.ts (quando ativar auth, usar proxy.ts)
- React Compiler ativo por padrão (não precisa de React.memo/useMemo manual)
- params e searchParams são async (sempre usar await)

## Referência

- PRD completo: `docs/prd.md`
- Schema Prisma: `prisma/schema.prisma`
- Seed de categorias: `prisma/seed.ts`
- Design tokens: `app/globals.css` (@theme block)
- Chart theme: `lib/chart-theme.ts`
