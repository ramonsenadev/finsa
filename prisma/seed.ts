import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Default user
  const user = await prisma.user.upsert({
    where: { email: "ramon@finsa.local" },
    update: {},
    create: {
      name: "Ramon",
      email: "ramon@finsa.local",
    },
  });

  console.log(`User: ${user.name} (${user.id})`);

  // CsvFormats (system-level, no user_id)
  const csvFormats = await Promise.all([
    prisma.csvFormat.upsert({
      where: { id: "fmt-nubank" },
      update: {},
      create: {
        id: "fmt-nubank",
        name: "Nubank",
        delimiter: ",",
        dateColumn: "date",
        descriptionColumn: "title",
        amountColumn: "amount",
        dateFormat: "YYYY-MM-DD",
        amountLocale: "en",
        skipRows: 0,
        encoding: "UTF-8",
        isSystem: true,
      },
    }),
    prisma.csvFormat.upsert({
      where: { id: "fmt-itau" },
      update: {},
      create: {
        id: "fmt-itau",
        name: "Itau",
        delimiter: ";",
        dateColumn: "data",
        descriptionColumn: "lançamento",
        amountColumn: "valor",
        dateFormat: "DD/MM/YYYY",
        amountLocale: "pt-BR",
        skipRows: 0,
        encoding: "ISO-8859-1",
        isSystem: true,
      },
    }),
    prisma.csvFormat.upsert({
      where: { id: "fmt-inter" },
      update: {},
      create: {
        id: "fmt-inter",
        name: "Inter",
        delimiter: ";",
        dateColumn: "Data",
        descriptionColumn: "Descrição",
        amountColumn: "Valor",
        dateFormat: "DD/MM/YYYY",
        amountLocale: "pt-BR",
        skipRows: 0,
        encoding: "UTF-8",
        isSystem: true,
      },
    }),
  ]);

  console.log(`CsvFormats: ${csvFormats.length} created`);

  // Categories — parent + children
  const categoryData: {
    name: string;
    icon: string;
    color: string;
    children: string[];
  }[] = [
    {
      name: "Alimentacao",
      icon: "utensils",
      color: "#F97316",
      children: [
        "Supermercado",
        "Restaurante",
        "Delivery",
        "Padaria",
        "Cafe",
        "Doces/Chocolates",
      ],
    },
    {
      name: "Moradia",
      icon: "home",
      color: "#3B82F6",
      children: [
        "Aluguel",
        "Condominio",
        "Energia",
        "Agua",
        "Gas",
        "Internet",
        "Manutencao",
        "Reforma",
      ],
    },
    {
      name: "Transporte",
      icon: "car",
      color: "#8B5CF6",
      children: [
        "Combustivel",
        "Estacionamento",
        "Pedagio",
        "Uber/99",
        "Transporte Publico",
        "Manutencao Veiculo",
      ],
    },
    {
      name: "Saude",
      icon: "heart-pulse",
      color: "#EF4444",
      children: [
        "Farmacia",
        "Consultas",
        "Plano de Saude",
        "Odontologia",
        "Manipulacao",
        "Exames",
      ],
    },
    {
      name: "Educacao",
      icon: "graduation-cap",
      color: "#6366F1",
      children: ["Escola", "Cursos", "Material Escolar", "Livros"],
    },
    {
      name: "Familia & Cuidados",
      icon: "baby",
      color: "#EC4899",
      children: [
        "Baba",
        "Fraldas/Bebe",
        "Brinquedos",
        "Roupas Infantis",
        "Enxoval",
      ],
    },
    {
      name: "Compras",
      icon: "shopping-bag",
      color: "#F59E0B",
      children: [
        "Roupas",
        "Eletronicos",
        "Casa & Decoracao",
        "Presentes",
        "E-commerce",
      ],
    },
    {
      name: "Assinaturas",
      icon: "repeat",
      color: "#8B5CF6",
      children: ["Streaming", "Apps", "SaaS", "Seguros"],
    },
    {
      name: "Lazer",
      icon: "gamepad-2",
      color: "#10B981",
      children: ["Restaurante (saida)", "Cinema", "Viagem", "Entretenimento"],
    },
    {
      name: "Servicos",
      icon: "wrench",
      color: "#6B7280",
      children: [
        "Lavanderia",
        "Pet",
        "Salao/Estetica",
        "Flores",
        "Servicos Gerais",
      ],
    },
    {
      name: "Investimentos",
      icon: "trending-up",
      color: "#10B981",
      children: [
        "Renda Fixa",
        "Renda Variavel",
        "Previdencia",
        "Criptomoedas",
      ],
    },
    {
      name: "Outros",
      icon: "circle-dot",
      color: "#9CA3AF",
      children: [
        "Nao categorizado",
        "Estorno",
        "Pagamento fatura",
        "Transferencia",
      ],
    },
  ];

  // Store category IDs for rules seeding
  const categoryMap: Record<string, string> = {};

  for (let i = 0; i < categoryData.length; i++) {
    const cat = categoryData[i];
    const parent = await prisma.category.upsert({
      where: { id: `cat-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}` },
      update: {},
      create: {
        id: `cat-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isSystem: true,
        sortOrder: i,
      },
    });

    categoryMap[cat.name] = parent.id;

    for (let j = 0; j < cat.children.length; j++) {
      const childName = cat.children[j];
      const child = await prisma.category.upsert({
        where: {
          id: `cat-${childName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        },
        update: {},
        create: {
          id: `cat-${childName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          name: childName,
          parentId: parent.id,
          icon: cat.icon,
          color: cat.color,
          isSystem: true,
          sortOrder: j,
        },
      });

      categoryMap[`${cat.name}>${childName}`] = child.id;
    }
  }

  console.log(`Categories: ${Object.keys(categoryMap).length} created`);

  // CategorizationRules — seed from Appendix A patterns
  const rules: {
    pattern: string;
    type: "exact" | "contains" | "regex";
    categoryKey: string;
  }[] = [
    // iFood → Alimentacao > Delivery
    { pattern: "Ifd*", type: "contains", categoryKey: "Alimentacao>Delivery" },
    { pattern: "ifood", type: "contains", categoryKey: "Alimentacao>Delivery" },
    // Pedagio → Transporte > Pedagio
    { pattern: "NuTag", type: "contains", categoryKey: "Transporte>Pedagio" },
    // Seguros Nu → Assinaturas > Seguros
    {
      pattern: "Nu Seguro",
      type: "contains",
      categoryKey: "Assinaturas>Seguros",
    },
    // Uber/99 → Transporte > Uber/99
    { pattern: "Pg *99", type: "contains", categoryKey: "Transporte>Uber/99" },
    { pattern: "99app", type: "contains", categoryKey: "Transporte>Uber/99" },
    { pattern: "Uber", type: "contains", categoryKey: "Transporte>Uber/99" },
    // E-commerce → Compras > E-commerce
    {
      pattern: "Amazon",
      type: "contains",
      categoryKey: "Compras>E-commerce",
    },
    {
      pattern: "Shopee",
      type: "contains",
      categoryKey: "Compras>E-commerce",
    },
    {
      pattern: "Mercadolivre",
      type: "contains",
      categoryKey: "Compras>E-commerce",
    },
    { pattern: "Shein", type: "contains", categoryKey: "Compras>E-commerce" },
    // Streaming → Assinaturas > Streaming
    {
      pattern: "Netflix",
      type: "contains",
      categoryKey: "Assinaturas>Streaming",
    },
    {
      pattern: "Spotify",
      type: "contains",
      categoryKey: "Assinaturas>Streaming",
    },
    {
      pattern: "Disney+",
      type: "contains",
      categoryKey: "Assinaturas>Streaming",
    },
    {
      pattern: "HBO Max",
      type: "contains",
      categoryKey: "Assinaturas>Streaming",
    },
    {
      pattern: "Prime Video",
      type: "contains",
      categoryKey: "Assinaturas>Streaming",
    },
    // Apps / Assinaturas
    {
      pattern: "Totalpass",
      type: "contains",
      categoryKey: "Assinaturas>Apps",
    },
    {
      pattern: "Ifd*Ifood Club",
      type: "contains",
      categoryKey: "Assinaturas>Apps",
    },
    // Pagamento fatura → Outros > Pagamento fatura
    {
      pattern: "Pagamento recebido",
      type: "contains",
      categoryKey: "Outros>Pagamento fatura",
    },
    // Desconto antecipacao → Outros > Estorno
    {
      pattern: "Desconto Antecipação",
      type: "contains",
      categoryKey: "Outros>Estorno",
    },
    // Keyword-based rules — common words in transaction descriptions
    // Alimentação
    { pattern: "restaurante", type: "contains", categoryKey: "Alimentacao>Restaurante" },
    { pattern: "lanchonete", type: "contains", categoryKey: "Alimentacao>Restaurante" },
    { pattern: "churrascaria", type: "contains", categoryKey: "Alimentacao>Restaurante" },
    { pattern: "pizzaria", type: "contains", categoryKey: "Alimentacao>Restaurante" },
    { pattern: "supermercado", type: "contains", categoryKey: "Alimentacao>Supermercado" },
    { pattern: "mercado", type: "contains", categoryKey: "Alimentacao>Supermercado" },
    { pattern: "hortifruti", type: "contains", categoryKey: "Alimentacao>Supermercado" },
    { pattern: "padaria", type: "contains", categoryKey: "Alimentacao>Padaria" },
    { pattern: "confeitaria", type: "contains", categoryKey: "Alimentacao>Padaria" },
    { pattern: "cafeteria", type: "contains", categoryKey: "Alimentacao>Cafe" },
    { pattern: "doceria", type: "contains", categoryKey: "Alimentacao>Doces/Chocolates" },
    { pattern: "chocolat", type: "contains", categoryKey: "Alimentacao>Doces/Chocolates" },
    // Saúde
    { pattern: "farmacia", type: "contains", categoryKey: "Saude>Farmacia" },
    { pattern: "drogaria", type: "contains", categoryKey: "Saude>Farmacia" },
    { pattern: "droga raia", type: "contains", categoryKey: "Saude>Farmacia" },
    { pattern: "drogasil", type: "contains", categoryKey: "Saude>Farmacia" },
    { pattern: "manipulacao", type: "contains", categoryKey: "Saude>Manipulacao" },
    // Transporte
    { pattern: "posto", type: "contains", categoryKey: "Transporte>Combustivel" },
    { pattern: "combustivel", type: "contains", categoryKey: "Transporte>Combustivel" },
    { pattern: "estacionamento", type: "contains", categoryKey: "Transporte>Estacionamento" },
    { pattern: "parking", type: "contains", categoryKey: "Transporte>Estacionamento" },
    // Serviços
    { pattern: "pet shop", type: "contains", categoryKey: "Servicos>Pet" },
    { pattern: "petshop", type: "contains", categoryKey: "Servicos>Pet" },
    { pattern: "veterinar", type: "contains", categoryKey: "Servicos>Pet" },
    { pattern: "lavanderia", type: "contains", categoryKey: "Servicos>Lavanderia" },
    // Compras
    { pattern: "aliexpress", type: "contains", categoryKey: "Compras>E-commerce" },
    { pattern: "magalu", type: "contains", categoryKey: "Compras>E-commerce" },
    { pattern: "magazine luiza", type: "contains", categoryKey: "Compras>E-commerce" },
    { pattern: "casas bahia", type: "contains", categoryKey: "Compras>E-commerce" },
  ];

  for (const rule of rules) {
    const categoryId = categoryMap[rule.categoryKey];
    if (!categoryId) {
      console.warn(`Category not found for rule: ${rule.categoryKey}`);
      continue;
    }

    await prisma.categorizationRule.upsert({
      where: {
        id: `rule-${rule.pattern.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      },
      update: {},
      create: {
        id: `rule-${rule.pattern.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        userId: user.id,
        matchPattern: rule.pattern,
        matchType: rule.type,
        categoryId,
        source: "manual",
        confidence: 1.0,
      },
    });
  }

  console.log(`CategorizationRules: ${rules.length} created`);

  console.log("Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
