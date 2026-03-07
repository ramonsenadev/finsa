# Finsa — Gestão Financeira Familiar

Aplicação web local-first para categorização e análise de gastos familiares. Importa CSVs de cartão de crédito (Nubank, Itaú, Inter), suporta lançamentos manuais, e contextualiza tudo em relação à renda familiar.

## Stack

- **Framework:** Next.js 16 (App Router, Server Actions, Turbopack)
- **Linguagem:** TypeScript (strict mode)
- **Banco:** PostgreSQL 16 (Docker)
- **ORM:** Prisma
- **UI:** shadcn/ui + Tailwind CSS
- **Charts:** Recharts
- **State:** TanStack Query
- **Validação:** Zod
- **CSV:** Papaparse
- **Export PDF:** @react-pdf/renderer
- **IA (opcional):** Anthropic Claude API (Haiku) para categorização

## Comandos

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Build de produção
npm run db:push      # Push schema Prisma
npm run db:migrate   # Rodar migrations
npm run db:seed      # Seed categorias padrão + CsvFormats
npm run db:studio    # Prisma Studio
npm run lint         # ESLint
npm run test         # Vitest
```

## Estrutura

```
app/                  # Rotas Next.js App Router
  (dashboard)/        # Dashboard principal (rota raiz)
  cards/              # CRUD cartões
  transactions/       # Listagem com filtros
  categories/         # Árvore de categorias
  import/             # Fluxo de import CSV
  recurring/          # Visão de recorrentes
  budget/             # Orçamento por categoria
  settings/           # Renda, investimentos, formatos CSV
components/
  ui/                 # Design system (shadcn/ui customizado)
  layout/             # Sidebar, header
  features/           # Componentes por feature
lib/
  categorization/     # Pipeline, rules engine, ai-adapter
  csv/                # Parsers, format detection
  recurring/          # Engine de detecção de recorrências
  analytics/          # Queries agregadas para dashboard
prisma/               # Schema e migrations
types/                # Tipos TypeScript compartilhados
```

## Convenções de Código

- Português para UI (labels, mensagens, categorias)
- Inglês para código (variáveis, funções, tipos, nomes de arquivo)
- Componentes: functional com hooks, named exports
- Server Actions para mutações simples; API Routes para operações complexas (import, IA batch)
- Zod schemas compartilhados entre front e back
- Sempre user_id em todas as tabelas (multi-user ready, mesmo sem auth ativa)
- Testes: Vitest para unit, Testing Library para componentes

## Design System

- **Estética:** Notion/Asana-like — limpo, espaçado, tipografia hierárquica
- **Paleta:** Background #FFFFFF/#F9FAFB, Text #111827/#6B7280, Accent #6366F1, Success #10B981, Warning #F59E0B, Error #EF4444, Recurring #8B5CF6
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

## Notas Next.js 16

- Turbopack é o bundler padrão (não usar --webpack)
- middleware.ts foi substituído por proxy.ts (quando ativar auth, usar proxy.ts)
- React Compiler ativo por padrão (não precisa de React.memo/useMemo manual)
- params e searchParams são async (sempre usar await)

## Referência

- PRD completo: `docs/prd.md`
- Schema Prisma: `prisma/schema.prisma`
- Seed de categorias: `prisma/seed.ts`
