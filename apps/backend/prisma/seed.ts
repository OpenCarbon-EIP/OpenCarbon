import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

// dotenv is not a direct dependency: rely on Node's built-in loader. In production
// the variables are injected by the environment, so a missing .env file is expected.
try {
  process.loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    throw error;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set (.env file or environment)');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// ISO 14064-1:2018 categories: 1 direct, 2 imported energy, 3 transport, 4 products used.
const EMISSION_CATEGORIES = [
  {
    code: '1_materiaux',
    label: 'Matériaux de construction',
    iso_14064_category: '4',
    is_direct: false,
  },
  {
    code: '2_carburant_engins',
    label: 'Carburant des engins de chantier',
    iso_14064_category: '1',
    is_direct: true,
  },
  {
    code: '3_transport_materiaux',
    label: 'Transport des matériaux et des déblais',
    iso_14064_category: '3',
    is_direct: false,
  },
  {
    code: '4_deplacements_personnel',
    label: 'Déplacements du personnel',
    iso_14064_category: '3',
    is_direct: false,
  },
  {
    code: '5_electricite',
    label: 'Électricité consommée sur le chantier',
    iso_14064_category: '2',
    is_direct: false,
  },
  {
    code: '6_dechets',
    label: 'Évacuation et traitement des déchets',
    iso_14064_category: '4',
    is_direct: false,
  },
  {
    code: '7_fluides_frigorigenes',
    label: 'Fuites de fluides frigorigènes',
    iso_14064_category: '1',
    is_direct: true,
  },
];

async function main(): Promise<void> {
  for (const [index, category] of EMISSION_CATEGORIES.entries()) {
    await prisma.emission_category.upsert({
      where: { code: category.code },
      update: { ...category, sort_order: index + 1 },
      create: { ...category, sort_order: index + 1 },
    });
  }

  console.log(`Seeded ${EMISSION_CATEGORIES.length} emission categories`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
