# Finsa — Gestao Financeira Familiar

Aplicacao web para categorizacao e analise de gastos familiares. Importa CSVs de cartao de credito (Nubank, Itau, Inter), suporta lancamentos manuais, e contextualiza tudo em relacao a renda familiar.

## Features

- **Dashboard** — Visao mensal com indicadores, grafico por categoria, gastos diarios e tabela detalhada
- **Import CSV** — Wizard de 3 etapas: selecao de cartao, preview com deteccao de duplicatas, resultado com categorizacao automatica
- **Categorizacao inteligente** — Pipeline: regras exatas > contains/regex > IA (Claude Haiku) > manual. Cada categorizacao manual gera regra automaticamente
- **Fila de Revisao** — Transacoes nao categorizadas ou com baixa confianca da IA, com navegacao por teclado
- **Transacoes** — Listagem completa com filtros avancados (periodo, cartao, categoria, valor, metodo), busca por descricao e export CSV
- **Lancamentos manuais** — Para gastos fora do cartao (Pix, boleto, dinheiro, debito)
- **Cartoes** — CRUD com visao detalhada por cartao (evolucao, categorias, historico de imports)
- **Recorrentes** — Deteccao automatica (3+ meses, ±10% tolerancia) e gestao manual de gastos fixos
- **Orcamento** — Limites mensais por categoria com acompanhamento visual de progresso
- **Comparacao temporal** — Evolucao de gastos por categoria ao longo dos meses com graficos interativos
- **Categorias** — Arvore hierarquica (pai/filho) com icones e cores customizaveis
- **Export PDF** — Relatorios mensais e comparativos em PDF
- **Tema** — Suporte a light, dark e auto

## Pre-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm

## Setup

### 1. Clone e instale dependencias

```bash
git clone <repo-url> finsa
cd finsa
npm install
```

### 2. Suba o banco PostgreSQL

```bash
docker compose up -d
```

Isso cria um container PostgreSQL 16 na porta 5432 (usuario: `finsa`, senha: `finsa`, banco: `finsa`).

### 3. Configure o ambiente

O arquivo `.env` ja vem com a configuracao padrao para o Docker local:

```
DATABASE_URL="postgresql://finsa:finsa@localhost:5432/finsa?schema=public"
```

### 4. Inicialize o banco

```bash
npm run db:push      # Cria as tabelas
npm run db:seed      # Popula categorias, formatos CSV e regras padrao
```

### 5. Rode em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Configuracao da IA (opcional)

Para categorizacao automatica via Claude Haiku, adicione ao `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Sem a key, a categorizacao funciona normalmente via regras. A IA e apenas um fallback opcional.

## Comandos

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Dev server (Turbopack, porta 3000) |
| `npm run build` | Build de producao |
| `npm run start` | Servir build de producao |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (79 testes) |
| `npm run db:push` | Push schema Prisma |
| `npm run db:migrate` | Migrations Prisma |
| `npm run db:seed` | Seed dados padrao |
| `npm run db:studio` | Prisma Studio (GUI) |

## Stack

- Next.js 16 (App Router, Server Actions, Turbopack, React Compiler)
- TypeScript 5.8
- PostgreSQL 16 (Docker)
- Prisma 6.6
- shadcn/ui + Tailwind CSS 4.1 + Radix UI
- Recharts 2.15
- TanStack Query 5
- Zod 3.24
- Papaparse 5.5
- @react-pdf/renderer 4.3
- Anthropic Claude API (opcional)
