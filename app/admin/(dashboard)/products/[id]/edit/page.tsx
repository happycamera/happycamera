import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { sortCategoriesByOrder } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
  where: { id },
  include: {
    variants: true,
  },
}),
    prisma.category.findMany(),
  ]);

  if (!product) notFound();

  return (
    <div className="p-8">
      <p className="text-xs text-gray-400 mb-1">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
        {" / "}
        <Link href="/admin/products" className="hover:text-gray-600 transition-colors">Products</Link>
        {" / Edit Product"}
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
        Edit Product
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        {product.name}
      </p>
      <div className="mt-8">
        <ProductForm categories={sortCategoriesByOrder(categories)} initialData={product} />
      </div>
    </div>
  );
}
