# Finsa — PRD v3 (Março 2026)

**Gestão Financeira Familiar** | Status: Draft v3 | Stack: Next.js 16 + PostgreSQL | Deploy: Local (self-hosted) | Export: CSV + PDF

---

## Phase 1: Problema & Contexto

### 1.1 Problem Statement

Famílias brasileiras utilizam múltiplos cartões de crédito de diferentes instituições (Nubank, Itaú, Inter, etc.) e têm dezenas de despesas recorrentes fora do cartão (escola, babá, energia, seguros, streaming), mas não possuem uma visão consolidada, categorizada e contextualizada de todos os gastos em relação à renda familiar.

Os extratos de cartão são exportados em CSVs com formatos distintos por instituição — colunas com nomes diferentes, separadores variados, formatos de data e valor inconsistentes — que não oferecem nenhuma análise, agrupamento ou relação com a renda. Categorizar manualmente é inviável para quem tem múltiplos cartões com centenas de transações mensais.

O resultado: decisões financeiras são tomadas sem visibilidade real. Não se sabe que percentual da renda vai para alimentação, moradia ou transporte. Parcelas se acumulam sem rastreamento, assinaturas esquecidas seguem cobrando, e não há como identificar padrões temporais (como picos de gasto nos fins de semana) ou tendências de crescimento em categorias específicas.

Dados de referência de um CSV Nubank analisado: 109 transações em um único mês, R$ 7.844 em gastos distribuídos entre ~70 estabelecimentos distintos, incluindo parcelas (1/2, 2/2, 5/10), descontos de antecipação e pagamentos. Uma família com 2–3 cartões facilmente ultrapassa 200 transações/mês.

### 1.2 User Persona

**Ramon — Pai e Diretor de Tecnologia**

Contexto: Pai de criança pequena em Salvador-BA, gerencia finanças da família junto com a parceira. Possuem cartões em diferentes instituições (Nubank, Itaú, Inter) e gastos recorrentes diversos fora do cartão. Quer entender não só para onde o dinheiro vai, mas quanto da renda está comprometido, quanto está sendo investido, e onde há margem para otimizar.

Pain points:
- Cada banco exporta CSV em formato diferente — colunas, separadores e encoding variam
- Categorização é manual e repetitiva: os mesmos estabelecimentos aparecem todo mês
- Parcelas se misturam com gastos avulsos; assinaturas passam despercebidas
- Gastos fixos (escola, babá, energia) ficam fora da análise porque não estão no cartão
- Não existe visão de quanto da renda está comprometido por categoria
- Não há rastreamento de investimentos mensais vs. gastos
- Impossível identificar padrões temporais (picos em fins de semana, sazonalidade)
- Soluções SaaS existentes exigem conexão bancária ou são genéricas demais

### 1.3 Cenários de Uso

**Cenário 1: Import Histórico Multi-banco.** Ramon baixa os CSVs de fatura dos últimos 12 meses de três bancos (Nubank, Itaú, Inter). Cadastra os cartões na aplicação. No primeiro import de cada banco, o sistema detecta automaticamente o formato do CSV (ou pede mapeamento de colunas). O pipeline de categorização processa tudo: regras resolvem o que já é conhecido, IA resolve o restante com alta confiança, e o que sobra vai para revisão manual. Cada categorização manual gera uma regra para uso futuro.

**Cenário 2: Rotina Mensal.** A fatura do mês fecha. Ramon exporta o CSV, importa na aplicação. Como a maioria dos estabelecimentos já foi categorizada em meses anteriores, o sistema resolve quase tudo sozinho. Ramon revisa apenas transações novas. Se percebe que uma transação antiga foi categorizada errado, ele a recategoriza a qualquer momento — a regra correspondente é atualizada.

**Cenário 3: Análise Financeira com Contexto de Renda.** Ramon cadastrou a renda mensal da família (R$ 25.000). No dashboard, vê que 32% da renda vai para moradia, 18% para alimentação, e 8% para investimentos. Compara os últimos 6 meses e percebe que alimentação cresceu de 15% para 18% da renda. Identifica no gráfico de flutuação diária que fins de semana concentram 40% mais gastos com restaurantes. Exporta um resumo em PDF para discutir com a parceira.

**Cenário 4: Despesas Avulsas e Recorrentes.** Ramon paga a babá via Pix. Entra na aplicação, lança: R$ 2.000, categoria "Babá", marca como recorrente. Faz o mesmo com escola, energia e condomínio. No mês seguinte, o sistema sugere os lançamentos com valores pré-preenchidos. A visão de recorrentes mostra todos os gastos fixos e quanto eles representam da renda.

**Cenário 5: Detecção de Recorrências Implícitas.** Após 3 meses de import, o sistema identifica que "Netflix.Com", "Ifd*Ifood Club" e "Totalpass" aparecem com o mesmo valor em todas as faturas. Sugere ao usuário: "3 transações parecem ser assinaturas. Deseja marcá-las como recorrentes?". Ramon confirma e elas passam a integrar a visão de gastos fixos.

**Cenário 6: Recategorização Retroativa.** Ramon percebe que categorizou "Ferreira Costa" como Compras, mas na verdade são gastos de construção/reforma. Recategoriza a transação para "Moradia > Manutenção". O sistema pergunta se deve aplicar a mesma correção a todas as transações passadas de "Ferreira Costa" e atualiza a regra de categorização.

### 1.4 Contexto Competitivo

| Solução | Pontos Fortes | Limitações | Diferencial Finsa |
|---------|---------------|------------|-------------------|
| Mobills / Organizze | UX polida, sync bancária | Sem import CSV flexível, sem self-host, modelo SaaS | Import CSV multi-banco, local-first |
| Planilha Google | Flexível, grátis | Zero automação, sem visão renda, não escala | Categorização automática + IA + % renda |
| Firefly III | Self-hosted, open source | UI datada, sem IA, sem análise temporal | UI moderna, IA, flutuação diária |
| Coração / Guiabolso | Agregação de contas | Requer Open Banking, privacidade | Dados locais, controle total |

### 1.5 Métricas de Sucesso

| Métrica | Target MVP | Medição | Confiança |
|---------|-----------|---------|-----------|
| Taxa de auto-categorização após 3 meses | ≥ 85% das transações | Ratio categ/total | Alta |
| Tempo de import mensal | < 5 min (import + revisão) | Timer UX | Média |
| Cobertura de gastos vs. renda | 100% dos gastos mapeados | Soma gastos / renda | Alta |
| Uso sustentado | Import mensal por 6+ meses | Log de imports | Média |
| Precisão da IA (quando usada) | ≥ 90% de acerto na categoria | Validação usuário | Média |
| Detecção de recorrências | ≥ 80% assinaturas detectadas | Match com extratos | Média |
| Bancos suportados sem config manual | ≥ 3 (Nubank, Itaú, Inter) | Import sem erros | Alta |

---

## Phase 2: Solução & Requisitos

### 2.1 Visão do Produto

Finsa é uma aplicação web local-first para gestão financeira familiar. Ela transforma CSVs de fatura de cartão (de qualquer instituição) e lançamentos manuais em uma visão consolidada, categorizada e contextualizada em relação à renda familiar. A interface segue a linha visual de Notion, Asana e ClickUp: limpa, espaçada, com hierarquia tipográfica clara.

Três princípios centrais:
- **Automação progressiva:** quanto mais você usa, menos trabalho você tem. A categorização aprende com cada decisão.
- **Contexto financeiro:** todo gasto existe em relação à renda. Percentuais de comprometimento, investimento e margem são visíveis o tempo todo.
- **Flexibilidade com correção:** qualquer categorização pode ser corrigida a qualquer momento, retroativamente, e o sistema aprende com a correção.

### 2.2 Entidades do Domínio

| Entidade | Descrição | Campos-chave |
|----------|-----------|-------------|
| Card | Cartão de crédito cadastrado | id, name, issuer (nubank\|itau\|inter\|outro), last_four_digits, holder_name, color, csv_format_id, is_active |
| CsvFormat | Formato de CSV por instituição | id, name, delimiter, date_column, description_column, amount_column, date_format, amount_locale, skip_rows, encoding |
| Category | Categoria hierárquica | id, name, parent_id?, icon, color, is_system |
| Transaction | Transação individual | id, source_type (card\|manual), card_id?, date, description, original_title, amount, category_id, installment_current?, installment_total?, is_recurring, categorization_method (rule\|ai\|manual), import_id? |
| Import | Registro de import CSV | id, card_id, file_name, month_ref, imported_at, tx_count, auto_categorized_count, ai_categorized_count, manual_pending_count |
| CategorizationRule | Regra aprendida | id, match_pattern, match_type (exact\|contains\|regex), category_id, source (manual\|ai), confidence, usage_count, last_used_at |
| RecurringExpense | Gasto fixo/recorrente | id, name, category_id, expected_amount, day_of_month?, source_type (card\|pix\|boleto\|debito), is_active, detection_method (manual\|auto) |
| Income | Renda mensal | id, name, amount, type (salary\|freelance\|business\|other), is_active, effective_from |
| Investment | Aporte mensal (sem rendimento) | id, name, category (renda_fixa\|renda_variavel\|previdencia\|outro), amount, is_active, effective_from |
| MonthlyBudget | Orçamento por categoria | id, category_id, amount, month_ref (YYYY-MM) |
| MonthSnapshot | Consolidação mensal (on-demand) | id, month_ref, total_income, total_expenses, total_investments, total_card, total_manual, computed_at |

### 2.3 Features & User Stories

#### Feature 1: Gestão de Cartões

O usuário cadastra múltiplos cartões de diferentes instituições. Cada cartão é associado a um formato de CSV (pré-configurado ou customizado).

**US-001: Cadastro de cartão.** DADO que estou na tela de cartões, QUANDO preencho nome, instituição (Nubank, Itaú, Inter, Outro), últimos 4 dígitos e titular, ENTÃO o cartão é criado com o formato CSV padrão da instituição selecionada pré-vinculado. Se a instituição for "Outro", sou direcionado ao mapeamento de colunas.

**US-002: Edição e desativação.** DADO que tenho um cartão cadastrado, QUANDO o desativo, ENTÃO as transações permanecem no histórico mas o cartão não aparece como opção de import.

#### Feature 2: Import de CSV Multi-banco

O import é o fluxo central. O sistema deve lidar com formatos de CSV distintos por instituição sem intervenção manual após a configuração inicial. Formatos pré-configurados para Nubank, Itaú e Inter; outros bancos via mapeamento manual.

**US-003: Import com formato pré-configurado.** DADO que selecionei um cartão Nubank e fiz upload de um CSV, QUANDO confirmo o import, ENTÃO o sistema usa o formato Nubank (date, title, amount; delimiter vírgula; UTF-8) para parsear, detecta parcelas pelo padrão "- Parcela X/Y", e registra o import com contadores.

**US-004: Import com auto-detecção de formato.** DADO que fiz upload de um CSV de instituição desconhecida ou com formato modificado, QUANDO o sistema não consegue parsear com o formato vinculado, ENTÃO exibe um preview das primeiras 5 linhas e permite mapear colunas (data, descrição, valor) interativamente. O mapeamento é salvo como CsvFormat para reusar.

**US-005: Detecção de duplicatas.** DADO que estou importando um CSV com transações já existentes (mesma data + original_title + amount para o mesmo cartão), QUANDO o import processa, ENTÃO as duplicatas são sinalizadas com badge visual e posso optar por ignorar, substituir ou manter ambas.

**US-006: Preview pré-import.** DADO que fiz upload do CSV, ANTES de confirmar o import, QUANDO vejo o preview, ENTÃO posso verificar: quantidade de transações, total de gastos/créditos, período coberto, e quantas serão categorizadas automaticamente (com breakdown: regras vs. IA vs. manual).

#### Feature 3: Categorização Inteligente

A categorização é o núcleo da automação do Finsa. O pipeline segue uma cascata de estratégias com custo crescente, priorizando resolução por regras (custo zero) e usando IA apenas como fallback. O objetivo é que a IA seja necessária cada vez menos ao longo do tempo.

**Pipeline de categorização (em ordem de prioridade):**
1. Match exato: compara original_title (normalizado) com regras exact. Custo zero, precisão 100%.
2. Match parcial: compara via contains/regex. Ex: qualquer título contendo "iFood" → Alimentação > Delivery. Custo zero, precisão muito alta.
3. IA (fallback): envia batch de transações não resolvidas para LLM com a lista de categorias disponíveis e exemplos de categorizações anteriores. Retorna sugestões com confidence score. Custo por chamada.
4. Manual (fila de revisão): transações que a IA não resolveu ou com confiança < 90% vão para fila visual. Cada categorização manual gera automaticamente uma regra exact match.

**US-007: Categorização automática por regras.** DADO que importei transações e existem regras salvas, QUANDO o pipeline roda, ENTÃO transações com match são categorizadas automaticamente e marcadas como categorization_method = rule.

**US-008: Categorização via IA.** DADO que existem transações sem match em regras, QUANDO o pipeline aciona o fallback de IA, ENTÃO o sistema envia as descrições em batch (sem valores, sem dados pessoais), recebe sugestões com confiança. Transações com confiança ≥ 90% são categorizadas automaticamente. Abaixo de 90% vão para revisão.

**US-009: Aprendizado automático.** DADO que categorizei manualmente uma transação, QUANDO salvo, ENTÃO o sistema cria uma regra exact match. Ao aceitar sugestão de IA, cria regra com source = ai. Ao rejeitar e recategorizar, cria regra com source = manual e a categoria correta.

**US-010: Recategorização retroativa.** DADO que identifiquei uma categorização errada em qualquer transação (independente de quando foi importada), QUANDO a recategorizo, ENTÃO o sistema pergunta: "Deseja aplicar essa correção a todas as N transações de [estabelecimento]?". Se confirmo, todas são atualizadas e a regra existente é substituída pela nova.

**US-011: Fila de revisão batch.** DADO que existem transações não categorizadas ou com baixa confiança, QUANDO acesso a fila de revisão, ENTÃO vejo uma tabela com colunas: data, descrição original, valor, categoria sugerida (se houver), confiança, e ação. A coluna de ação possui um seletor inline de categoria com busca rápida. Posso navegar entre linhas por teclado (setas para mover, Enter para abrir seletor, Tab para confirmar e avançar), selecionar múltiplas transações via checkbox para categorização em batch, e ordenar/filtrar por qualquer coluna. O header da tabela exibe: total na fila, categorizados na sessão, e restantes.

#### Feature 4: Categorias Hierárquicas

**US-012: Árvore de categorias.** DADO que acesso a gestão de categorias, QUANDO visualizo a árvore, ENTÃO vejo categorias de sistema pré-criadas com subcategorias (detalhadas na seção 2.4), além de poder criar, editar, reorganizar e excluir categorias customizadas.

#### Feature 5: Renda, Investimentos e Orçamento

A renda e os investimentos são entidades de primeiro nível que contextualizam todos os gastos.

**US-013: Cadastro de renda mensal.** DADO que acesso Configurações > Renda, QUANDO cadastro uma fonte de renda (ex: Salário Ramon, R$ 15.000; Renda Parceira, R$ 10.000), ENTÃO a renda total familiar é calculada e usada como base para todos os percentuais de comprometimento no dashboard.

**US-014: Cadastro de investimentos.** DADO que acesso Configurações > Investimentos, QUANDO cadastro um aporte mensal (ex: Renda Fixa, R$ 3.000; Previdência, R$ 1.500), ENTÃO o valor aparece no dashboard como "investido" com percentual da renda. O cadastro registra apenas o aporte mensal, sem rastreamento de rendimento ou saldo acumulado (escopo futuro). Investimentos podem variar mês a mês; o cadastro é o valor padrão, editável por mês.

**US-015: Orçamento por categoria.** DADO que acesso Orçamento, QUANDO defino um limite mensal por categoria (ex: Alimentação R$ 4.000, Transporte R$ 800), ENTÃO o dashboard exibe progresso visual (barra de progresso com cor: verde < 80%, amarelo 80-100%, vermelho > 100%) e a visão geral mostra quanto do orçamento total está comprometido.

#### Feature 6: Despesas Manuais e Recorrentes

**US-016: Lançamento manual com flag de recorrência.** DADO que tenho um gasto fora do cartão, QUANDO preencho data, descrição, valor, categoria e método de pagamento, ENTÃO informo também se é recorrente ou não. Se recorrente, ele integra a visão de gastos fixos. Se não, aparece apenas como transação avulsa.

**US-017: Sugestão mensal de recorrentes.** DADO que cadastrei gastos recorrentes, QUANDO um novo mês inicia, ENTÃO o sistema exibe um painel: "Você tem N gastos recorrentes para este mês. Confirme ou ajuste os valores." O usuário pode confirmar em batch ou individualmente.

**US-018: Detecção automática de recorrências.** DADO que existem transações de cartão com o mesmo título (normalizado) aparecendo em 3+ meses consecutivos com valor similar (±10%, padrão configurável em Configurações > Preferências), QUANDO o sistema detecta esse padrão, ENTÃO sugere: "Identificamos N transações que parecem ser recorrentes (assinaturas, seguros, etc.). Deseja marcá-las?". O usuário pode aceitar, rejeitar, ou postergar. Aceitar cria RecurringExpense com detection_method = auto.

> **Nota de viabilidade (US-018):** A detecção funciona bem para assinaturas de valor fixo (Netflix, Totalpass, iFood Club, Nu Seguro) e gastos com pequena variação (NuTag pedágio). É menos confiável para gastos que repetem o estabelecimento mas com valores muito diferentes (ex: supermercado). A tolerância padrão de ±10% é configurável pelo usuário.

#### Feature 7: Dashboard & Análise

**US-019: Visão mensal consolidada com contexto de renda.** DADO que acesso o dashboard e tenho renda cadastrada, QUANDO seleciono um mês, ENTÃO vejo: total de gastos, renda total, saldo (renda - gastos - investimentos), percentual comprometido por macro-categoria (alimentação X%, moradia Y%), distribuição por categoria (bar chart horizontal ou treemap), top 10 maiores gastos, split cartão vs. manual, e total investido com % da renda.

**US-020: Visão recorrente vs. não-recorrente.** DADO que estou no dashboard, QUANDO ativo o filtro/toggle "Recorrente / Não-recorrente / Todos", ENTÃO a visão se ajusta: modo Recorrente mostra apenas gastos fixos com total e % da renda; modo Não-recorrente mostra gastos variáveis; modo Todos mostra ambos com destaque visual (badge/cor) diferenciando.

**US-021: Flutuação diária de gastos.** DADO que seleciono um mês no dashboard, QUANDO acesso a visão de flutuação, ENTÃO vejo um gráfico de área/linha com gastos por dia, onde dias de semana são diferenciados visualmente de fins de semana. Ao passar o mouse sobre um pico, vejo o breakdown por categoria daquele dia. Abaixo do gráfico, um resumo: "Média dias úteis: R$ X | Média fins de semana: R$ Y (+Z%)" e as categorias que mais contribuem para o delta.

**US-022: Comparação temporal personalizável.** DADO que estou no dashboard, QUANDO acesso a comparação temporal, ENTÃO posso escolher entre presets (últimos 3 meses, 6 meses, 12 meses, ano corrente) ou definir período customizado (data início e fim). O gráfico de evolução mostra gastos por categoria ao longo dos meses, com destaque para categorias que cresceram acima de 20%. Cada categoria pode ser expandida para ver subcategorias.

**US-023: Visão por cartão.** DADO que seleciono um cartão específico, QUANDO acesso sua visão, ENTÃO vejo histórico de imports, total por mês, categorias predominantes, e transações com filtros. A visão inclui um mini-gráfico de evolução mensal.

**US-024: Busca e filtros avançados.** DADO que estou na listagem de transações, QUANDO aplico filtros (cartão, categoria, período, valor mín/máx, método categorização, recorrente/não-recorrente), ENTÃO a lista atualiza em tempo real e posso exportar o resultado em CSV ou PDF.

#### Feature 8: Indicadores de Saúde Financeira

**US-025: Painel de indicadores.** DADO que tenho renda e gastos cadastrados para o mês, QUANDO acesso o dashboard, ENTÃO vejo cards de indicadores no topo: Renda Total (R$ X), Total Gastos (R$ Y, Z% da renda), Total Investido (R$ W, K% da renda), Saldo Livre (R$ S, P% da renda). Cada card tem seta indicando variação vs. mês anterior.

**US-026: Comprometimento por macro-categoria.** DADO que visualizo o dashboard, ENTÃO vejo um breakdown horizontal: Moradia X% da renda, Alimentação Y%, Transporte Z%, etc. Cada barra é comparável com o orçamento definido (se houver) e com o mês anterior.

**US-027: Evolução da taxa de investimento.** DADO que tenho investimentos cadastrados por 3+ meses, QUANDO acesso o painel de investimentos, ENTÃO vejo a evolução do percentual investido vs. renda ao longo do tempo, com meta visual (se definida).

#### Feature 9: Export (CSV + PDF)

O export é oferecido em dois formatos com propósitos complementares. CSV para reanálise em planilha; PDF como relatório visual para discussão e tomada de decisão. O PDF segue o estilo visual da aplicação (paleta, tipografia Inter, layout limpo).

**US-028: Export CSV.** DADO que estou em qualquer listagem de transações (geral, filtrada, por cartão), QUANDO clico em Exportar > CSV, ENTÃO recebo um arquivo com todas as transações visíveis, incluindo colunas: data, descrição, valor, categoria, subcategoria, cartão, método de categorização, recorrente (sim/não).

**US-029: Export PDF — Relatório Mensal.** DADO que estou no dashboard com um mês selecionado, QUANDO clico em Exportar > PDF, ENTÃO é gerado um relatório de 2–4 páginas:
1. Capa: nome do relatório, período, data de geração. Cards de indicadores: Renda Total, Total Gastos (% renda), Total Investido (% renda), Saldo Livre (% renda), cada um com variação vs. mês anterior.
2. Distribuição por categoria: bar chart horizontal com valor absoluto e % da renda. Destaque visual para categorias acima do orçamento. Tabela resumo: categoria, valor, % renda, % total gastos, vs. mês anterior, vs. orçamento.
3. Flutuação diária: gráfico de área com destaque para fins de semana. Média dias úteis vs. fins de semana.
4. Top 15 maiores gastos: tabela com data, descrição, categoria, valor. Split recorrentes vs. não-recorrentes com subtotais.

**US-030: Export PDF — Relatório Comparativo.** DADO que estou na visão de comparação temporal com período selecionado, QUANDO clico em Exportar > PDF, ENTÃO é gerado um relatório com: gráfico de evolução por categoria, tabela de variação (categoria, primeiro mês, último mês, delta %, tendência), destaque para categorias com crescimento > 20%, e resumo de investimentos no período.

### 2.4 Categorias Padrão (Sistema)

| Categoria | Subcategorias |
|-----------|--------------|
| Alimentação | Supermercado, Restaurante, Delivery (iFood), Padaria, Café, Doces/Chocolates |
| Moradia | Aluguel, Condomínio, Energia, Água, Gás, Internet, Manutenção, Reforma |
| Transporte | Combustível, Estacionamento, Pedágio, Uber/99, Transporte Público, Manutenção Veículo |
| Saúde | Farmácia, Consultas, Plano de Saúde, Odontologia, Manipulação, Exames |
| Educação | Escola, Cursos, Material Escolar, Livros |
| Família & Cuidados | Babá, Fraldas/Bebê, Brinquedos, Roupas Infantis, Enxoval |
| Compras | Roupas, Eletrônicos, Casa & Decoração, Presentes, E-commerce |
| Assinaturas | Streaming (Netflix, etc.), Apps (iFood Club, Totalpass), SaaS, Seguros |
| Lazer | Restaurante (saída), Cinema, Viagem, Entretenimento |
| Serviços | Lavanderia, Pet, Salão/Estética, Flores, Serviços Gerais |
| Investimentos | Renda Fixa, Renda Variável, Previdência, Criptomoedas |
| Outros | Não categorizado, Estorno, Pagamento fatura, Transferência |

### 2.5 Requisitos Não-Funcionais

**Performance:**
- Import de CSV com 500 transações: < 3 segundos (sem contabilizar chamada de IA)
- Dashboard com 12 meses de dados (~2.000 transações): render < 1 segundo
- Busca e filtros: resposta < 200ms
- Recategorização batch (ex: 50 transações de mesmo estabelecimento): < 2 segundos

**Usabilidade:**
- Interface responsiva (desktop-first, mas usável em mobile)
- Todas as ações destrutivas pedem confirmação
- Feedback visual claro: loading states, toasts de sucesso/erro, empty states informativos
- Atalhos de teclado para ações frequentes (categorizar, navegar mês, pular transação)
- Recategorização é acessível de qualquer tela onde transações aparecem

**Segurança:**
- Dados financeiros armazenados apenas localmente (PostgreSQL local)
- Chamadas à IA usam apenas descrições de transação (sem valores, sem dados pessoais)
- Autenticação opcional no MVP, mas arquitetura suporta multi-user desde o início (user_id em todas as tabelas)

**Escalabilidade:**
- Schema do banco suporta múltiplos usuários desde o dia 1
- Categorização por IA é pluggável: inicialmente Claude API (Haiku), aceita outros providers via adapter
- Import de CSV é extensível: novos formatos via entidade CsvFormat, sem código
- Preparado para futura integração direta com bancos (Open Finance) via abstraction layer no source_type

---

## Phase 3: Técnico & Implementação

### 3.1 Arquitetura Técnica

Monolito modular com Next.js. Server Actions para mutações, API Routes para operações complexas (import, IA). Maximiza produtividade com Claude Code e mantém simplicidade operacional.

**Stack:**

| Camada | Tecnologia | Justificativa |
|--------|-----------|--------------|
| Framework | Next.js 16 (App Router, Turbopack) | SSR + Server Actions, Turbopack default, React Compiler built-in |
| Linguagem | TypeScript | Type safety, melhor autocomplete e refactoring |
| Banco de dados | PostgreSQL 16 | Robusto, JSON support, window functions para analytics |
| ORM | Prisma | Schema declarativo, migrations, type-safe queries |
| UI Library | shadcn/ui + Tailwind CSS | Componentes unstyled customizáveis, estética Notion-like |
| Charts | Recharts | Boa integração React, customizável, suporta área/linha/barra |
| IA | Anthropic Claude API (Haiku) | Baixo custo para categorização batch, alta qualidade |
| Autenticação | NextAuth.js (preparado, não ativo no MVP) | Multi-provider quando ativar; usar proxy.ts (Next.js 16) |
| Validação | Zod | Schema validation compartilhado front/back |
| State | TanStack Query | Cache, mutations, optimistic updates |
| CSV Parsing | Papaparse | Robusto, detecta delimitadores, streaming para arquivos grandes |
| Export PDF | @react-pdf/renderer | Componentes React para gerar PDF com estilo visual consistente |

**Estrutura de Diretórios:**

```
finsa/
├── app/                  # Rotas Next.js App Router
│   ├── (dashboard)/      # Dashboard principal
│   ├── cards/            # Gestão de cartões
│   ├── transactions/     # Listagem e filtros
│   ├── categories/       # Árvore de categorias
│   ├── import/           # Fluxo de import CSV
│   ├── recurring/        # Visão de recorrentes
│   ├── budget/           # Orçamento por categoria
│   └── settings/         # Renda, investimentos, formatos CSV, preferências
├── components/
│   ├── ui/               # Design system base (shadcn/ui customizado)
│   ├── layout/           # Sidebar, header, page containers
│   └── features/         # Componentes por feature
├── lib/
│   ├── categorization/   # Pipeline, rules engine, ai-adapter
│   ├── csv/              # Parsers, format-detector
│   ├── recurring/        # Detection engine
│   └── analytics/        # Queries agregadas
├── prisma/               # Schema e migrations
└── types/                # Tipos TypeScript compartilhados
```

### 3.2 Design System & UI

Identidade visual seguindo ferramentas de produtividade: espaçamento generoso, tipografia hierárquica, cores sóbrias com acentos pontuais, micro-interações que comunicam estado.

**Princípios de Design:**
- Density control: interface espaçada por padrão, com opção compact para tabelas
- Progressive disclosure: mostrar o essencial, revelar detalhes sob demanda
- Consistent metaphors: cartão → badge colorido, categoria → ícone + cor, recorrente → ícone de ciclo, status → dot indicator
- Motion with purpose: transições suaves em mudanças de estado, sem animações gratuitas

**Tokens de Design:**

| Token | Valor | Uso |
|-------|-------|-----|
| Background | #FFFFFF / #F9FAFB | Fundo principal / Sidebar e áreas secundárias |
| Text primary | #111827 | Headings e corpo principal |
| Text secondary | #6B7280 | Labels, metadata, placeholders |
| Border | #E5E7EB | Divisores, bordas de card e tabela |
| Accent | #6366F1 (Indigo 500) | Botões primários, links, elementos interativos |
| Success / Warning / Error | #10B981 / #F59E0B / #EF4444 | Orçamento ok / próximo do limite / acima |
| Recurring badge | #8B5CF6 (Violet 500) | Indicador visual de gasto recorrente |
| Font | Inter | Toda a interface; 14px base, 13px compact |
| Border radius | 8px / 6px | Cards e modais / Inputs e botões |
| Spacing scale | 4px base | 4, 8, 12, 16, 24, 32, 48, 64 |

**Layout:** Sidebar fixa à esquerda (240px, collapsible) com navegação: Dashboard, Transações, Cartões, Recorrentes, Categorias, Import, Orçamento, Configurações. Header com seletor de período (presets + custom), indicadores de renda, e busca global. Conteúdo principal com max-width de 1200px centralizado.

### 3.3 Dependências & Integrações

**Obrigatórias:** PostgreSQL 16+ (Docker recomendado), Node.js 20+

**Opcionais:** Anthropic API key (para categorização IA), Docker Compose

**Futura:** Open Finance API (integração direta com bancos — não no MVP, mas arquitetura preparada)

### 3.4 Fases de Implementação

**Fase 1: Fundação + Modelo Financeiro (Semana 1-2)**

Setup do projeto, banco de dados com schema completo (incluindo Income, Investment, MonthlyBudget), design system base, CRUD de cartões, categorias, configuração de renda e investimentos.

- Milestone: Projeto rodando, seed de categorias padrão + 3 CsvFormats (Nubank, Itaú, Inter), CRUD cartões, tela de renda e investimentos funcional, layout base
- Teste: criar 3 cartões de bancos diferentes, cadastrar renda familiar, cadastrar 2 investimentos, verificar cálculo de renda total

**Fase 2: Import Multi-banco & Categorização (Semana 3-5)**

Import de CSV com detecção de formato, pipeline completo de categorização (rules + IA + manual), recategorização retroativa, fila de revisão batch.

- Milestone: Import funcional para Nubank/Itaú/Inter, preview pré-import, detecção duplicatas, pipeline categorização completo, tela de revisão com keyboard nav, recategorização retroativa com propagação
- Teste: importar CSVs de 2+ bancos, verificar ≥ 60% auto-categorizado no primeiro import, recategorizar uma transação e verificar propagação, re-importar e verificar taxa ≥ 90%

**Fase 3: Dashboard, Análise & Orçamento (Semana 6-8)**

Dashboard completo com contexto de renda, flutuação diária, comparação temporal personalizável, indicadores financeiros, orçamento por categoria, visão recorrente/não-recorrente.

- Milestone: Dashboard com todos os indicadores (renda, gastos, investimento, saldo), gráfico de flutuação diária com destaque fim de semana, comparação temporal com presets + custom, orçamento com progress bars, toggle recorrente/não-recorrente, export CSV + PDF
- Teste: com 3+ meses importados e renda cadastrada, verificar % de comprometimento, identificar pico de fim de semana, comparar períodos customizados, verificar alerta de orçamento estourado

**Fase 4: Recorrentes, Detecção & Polish (Semana 9-10)**

Despesas manuais com flag recorrente, sugestão mensal, detecção automática de recorrências, visão dedicada de recorrentes, refinamentos de UX.

- Milestone: CRUD despesas manuais com flag recorrente, painel de sugestão mensal, engine de detecção de recorrências (3+ meses, ±10% valor padrão configurável), visão por cartão com mini-gráfico, empty states, loading states, keyboard shortcuts, error boundaries
- Teste: lançar despesas manuais recorrentes e não-recorrentes, verificar sugestão no mês seguinte, com 3+ meses importados verificar detecção de Netflix/Totalpass/Nu Seguro como recorrentes

### 3.5 Riscos & Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Formato CSV varia entre bancos e versões | Alta | Import falha ou dados incorretos | CsvFormat configurável, preview pré-import, mapeamento interativo |
| IA categoriza incorretamente | Média | Dados poluem análise | Threshold ≥ 90%, recategorização retroativa fácil, propagação de correção |
| Falso positivo na detecção de recorrência | Média | Usuário perde confiança | Critério conservador (±10%, 3+ meses), confirmação explícita |
| Complexidade do pipeline categorização | Média | Código frágil | Testes unitários extensivos, estratégias isoladas |
| Custo API IA em import histórico | Baixa | Custo inesperado | Haiku (mais barato), batch, cache de resultados |
| Renda varia mês a mês | Baixa | Percentuais imprecisos | Income com effective_from, editável por mês |

### 3.6 Decisões Fechadas

- Tolerância de detecção de recorrência: ±10% padrão, configurável pelo usuário
- Export: CSV + PDF. PDF segue estilo visual da aplicação com layout de relatório financeiro
- Frequência do MonthSnapshot: on-demand (recalcula quando dashboard é acessado ou após import/edição)
- Investimentos: rastreamento de aporte mensal apenas, sem histórico de rendimento (escopo futuro)
- UX da fila de revisão: tabela com seletor inline de categoria, navegação por teclado, batch via checkbox
- Nome: Finsa (confirmado)
- Suporte offline: não necessário no momento

### 3.7 Decisões em Aberto

- Comportamento quando renda não está cadastrada: esconder indicadores de % ou exibir com prompt para cadastrar?
- Persistência do MonthSnapshot: invalidar cache após qualquer edição no mês, ou always recompute?
- Gráficos no PDF: renderizar como imagem estática (via canvas) ou reproduzir como SVG inline?

---

## Apêndice A: Formatos CSV Conhecidos

### Nubank (cartão de crédito)

| Coluna | Tipo | Formato | Observações |
|--------|------|---------|-------------|
| date | string | YYYY-MM-DD | Data da transação |
| title | string | — | Nome do estabelecimento. Pode incluir "- Parcela X/Y" |
| amount | decimal | ponto como separador | Positivo = gasto. Negativo = crédito |

Delimiter: vírgula. Encoding: UTF-8. Sem header de metadata.

### Itaú (cartão de crédito) — formato típico

| Coluna | Tipo | Formato | Observações |
|--------|------|---------|-------------|
| data | string | DD/MM/YYYY | Data da transação |
| descricao / lançamento | string | — | Descrição da compra |
| valor | decimal | vírgula como separador | Pode vir com R$ prefix |

Delimiter: ponto-e-vírgula. Encoding: ISO-8859-1 ou Windows-1252. Pode ter linhas de header/footer de metadata para ignorar.

### Inter (cartão de crédito) — formato típico

| Coluna | Tipo | Formato | Observações |
|--------|------|---------|-------------|
| Data | string | DD/MM/YYYY | Data da transação |
| Descrição | string | — | Descrição da compra |
| Valor | decimal | vírgula como separador | Pode vir sem sinal negativo para gastos |

Delimiter: ponto-e-vírgula. Encoding: pode variar.

### Padrões de Transação (seeds de CategorizationRule)

- Parcelas: "Nome - Parcela X/Y" (regex: `/- Parcela (\d+)\/(\d+)$/`)
- Desconto antecipação: "Desconto Antecipação Nome" (valor negativo)
- Pagamento fatura: "Pagamento recebido" (valor negativo alto)
- iFood: prefix "Ifd*" (contains → Alimentação > Delivery)
- Pedágio: prefix "NuTag*" (contains → Transporte > Pedágio)
- Seguros Nu: "Nu Seguro" (contains → Assinaturas > Seguros)
- Uber/99: prefix "Pg *99", "99app" (contains → Transporte > Uber/99)
- E-commerce: "Amazon", "Shopee", "Mercadolivre", "Shein" (contains → Compras > E-commerce)
- Streaming: "Netflix" (contains → Assinaturas > Streaming)
