import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BuyArea from "@/components/ui/BuyArea";
import Gallery from "@/components/ui/Gallery";
import ReviewSection from "@/components/ui/ReviewSection";
import StickyAddToCart from "@/components/ui/StickyAddToCart";
import ProductCard from "@/components/ui/ProductCard";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
export const revalidate = 300;

const getProduct = cache(async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
  reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } },
  variants: true,
},
  });
  return product;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} — Happy Camera`,
    description: product.description.slice(0, 160),
    openGraph: {
      type: "website",
      siteName: "Happy Camera",
      title: product.name,
      description: product.description.slice(0, 160),
      url: `/product/${slug}`,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const productPromise = getProduct(slug);

  const relatedPromise = productPromise.then((product) =>
    product?.categoryId
      ? prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: product.id },
          },
          take: 4,
        })
      : []
  );

  const [product, relatedProducts] = await Promise.all([
    productPromise,
    relatedPromise,
  ]);

  if (!product) notFound();

  const cartProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    condition: product.condition as "new" | "preloved",
    images: product.images,
  };

  const inStock = product.stockQuantity > 0;
  const isOnSale = product.originalPrice != null && product.originalPrice > product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "MYR",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {inStock && <StickyAddToCart product={cartProduct} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:pb-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Gallery images={product.images} name={product.name} />

          <div className="flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">
              {product.brand}
            </p>
            <h1 className="text-2xl font-bold text-black mt-2 font-heading">
              {product.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
              <p
                className={cn(
                  "text-2xl font-semibold",
                  isOnSale ? "text-red-600" : "text-black"
                )}
              >
                {formatPrice(product.price)}
              </p>
              {isOnSale && (
                <>
                  <span className="text-sm md:text-[15px] font-medium text-gray-400 line-through">
                    {formatPrice(product.originalPrice!)}
                  </span>
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-[2px] uppercase leading-none tracking-wide whitespace-nowrap">
                    ON SALE
                  </span>
                </>
              )}
            </div>

            <BuyArea
  product={cartProduct}
  initialStock={product.stockQuantity}
  variants={product.variants}
/>

            <div className="mt-6">
  <h2 className="text-lg font-bold text-black mb-3">
    Product Description
  </h2>

  <div className="text-base text-gray-600 leading-7 space-y-3">
  <ReactMarkdown
    components={{
      h1: ({ children }) => (
        <h2 className="text-xl font-bold text-black mt-5 mb-3">
          {children}
        </h2>
      ),
      h2: ({ children }) => (
        <h3 className="text-lg font-bold text-black mt-4 mb-2">
          {children}
        </h3>
      ),
      p: ({ children }) => <p className="mb-3">{children}</p>,
      strong: ({ children }) => (
        <strong className="font-bold text-black">{children}</strong>
      ),
      ul: ({ children }) => (
        <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
      ),
    }}
  >
    {product.description}
  </ReactMarkdown>
</div>
</div>
            <div className="mt-8">
              <div className="flex justify-between py-4 border-b border-[#E5E5E5]">
                <span className="text-base font-medium text-black">Condition</span>
                <span className="text-base font-medium text-black">
                  {product.condition === "new" ? "New" : "Preloved"}
                </span>
              </div>
              {product.includedAccessories && product.includedAccessories.length > 0 && (
                <div className="flex justify-between py-4 border-b border-[#E5E5E5]">
                  <span className="text-base font-medium text-black">Includes</span>
                  <ul className="text-base text-gray-500 text-right">
                    {product.includedAccessories.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
{product.freeGifts && product.freeGifts.length > 0 && (
  <div className="flex justify-between gap-4 py-4 border-b border-[#E5E5E5]">
    <span className="text-base font-medium text-black">
      🎁 Free Gifts
    </span>
    <ul className="text-base text-gray-500 text-right">
      {product.freeGifts.map((gift, i) => (
        <li key={i}>🎁 {gift}</li>
      ))}
    </ul>
  </div>
)}

              <div className="flex justify-between py-4 border-b border-[#E5E5E5]">
                <span className="text-base font-medium text-black">Warranty</span>
                <span className="text-base font-medium text-black">
                  {product.warranty || "6-month warranty on all products."}
                </span>
              </div>
            </div>
          </div>
        </div>

        <ReviewSection
          productId={product.id}
          reviews={product.reviews.map((r) => ({
            id: r.id,
            customerName: r.customerName,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
          }))}
        />

        {relatedProducts.length > 0 && (
          <section className="mt-12 pt-10 border-t border-[var(--color-border)]">
            <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mb-6">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  name={p.name}
                  brand={p.brand}
                  price={p.price}
                  originalPrice={p.originalPrice}
                  condition={p.condition as "new" | "preloved"}
                  images={p.images}
                  stockQuantity={p.stockQuantity}
                  reviews={[]}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
