import { prisma } from "../lib/prisma";

export const FIXTURE_MIRRORLESS = "E2E Fixture Mirrorless Camera";
export const FIXTURE_DSLR = "E2E Fixture DSLR Camera";
export const FIXTURE_SONY_WIDE = "E2E Fixture Sony Wide";

const FIXTURES = [
  {
    slug: "e2e-fixture-mirrorless",
    name: FIXTURE_MIRRORLESS,
    brand: "Sony",
    price: 1000,
    subcategory: "Mirrorless",
  },
  {
    slug: "e2e-fixture-dslr",
    name: FIXTURE_DSLR,
    brand: "Nikon",
    price: 1500,
    subcategory: "DSLR",
  },
  {
    slug: "e2e-fixture-sony-wide",
    name: FIXTURE_SONY_WIDE,
    brand: "Sony",
    price: 2500,
    subcategory: "Compact",
  },
] as const;

const IMAGE =
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80";

const create = async () => {
  const category = await prisma.category.findFirst({
    where: { slug: "cameras" },
  });
  if (!category) throw new Error("cameras category not found; run prisma db seed first");

  for (const f of FIXTURES) {
    await prisma.product.deleteMany({ where: { slug: f.slug } });
    await prisma.product.create({
      data: {
        slug: f.slug,
        name: f.name,
        brand: f.brand,
        price: f.price,
        originalPrice: null,
        condition: "new",
        conditionGrade: null,
        conditionNotes: null,
        includedAccessories: [],
        shutterCount: null,
        images: [IMAGE],
        stockQuantity: 5,
        subcategory: f.subcategory,
        mount: null,
        format: null,
        warranty: null,
        description: "E2E catalog fixture product. Safe to delete.",
        categoryId: category.id,
      },
    });
  }
  console.log(`created ${FIXTURES.length} e2e fixture products`);
};

const remove = async () => {
  const { count } = await prisma.product.deleteMany({
    where: { slug: { in: FIXTURES.map((f) => f.slug) } },
  });
  console.log(`removed ${count} e2e fixture products`);
};

const arg = (process.argv[2] || "").replace(/^--/, "");
if (arg === "create") await create();
else if (arg === "remove") await remove();
else console.log("usage: tsx scripts/seed-test-catalog.ts --create|--remove");

await prisma.$disconnect();