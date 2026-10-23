"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import ProductCard from "@/components/ui/ProductCard";
import GridSidebar from "@/components/home/GridSidebar";
import { useReducedMotion, materialEase } from "@/lib/motion";
import type { HomeCategoryName, HomepageProduct } from "@/lib/homepageProducts";

type Tab = "all" | "new" | "preloved";

const CATEGORIES = ["Cameras", "Lenses", "Accessories"] as const;

const tabs: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "Brand New" },
  { value: "preloved", label: "Preloved" },
];

const staggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: materialEase },
  },
};

export default function HomepageProductGrid({
  products,
}: {
  products: Record<HomeCategoryName, HomepageProduct[]>;
}) {
  const [active, setActive] = useState<Tab>("all");
  const [selectedCat, setSelectedCat] = useState<HomeCategoryName>("Cameras");
  const reduced = useReducedMotion();

  const categories = [...CATEGORIES];
  const current = products[selectedCat];

  const filtered = current.filter((p) => active === "all" || p.condition === active);

  return (
    <section className="w-full px-3 md:px-4 lg:px-8 pt-8 pb-12 md:pt-12 md:pb-24">
      <div className="flex items-center justify-center gap-2 mb-8 md:mb-12">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={
              "px-5 py-2 text-[13px] font-medium tracking-wider uppercase transition-colors duration-200 border " +
              (active === tab.value
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="md:hidden">
        <GridSidebar
          categories={categories}
          selected={selectedCat}
          onChange={(cat) => setSelectedCat(cat as HomeCategoryName)}
          className="hidden"
        />
      </div>

      <div className="flex gap-8 mt-4 md:mt-0">
        <GridSidebar
          categories={categories}
          selected={selectedCat}
          onChange={(cat) => setSelectedCat(cat as HomeCategoryName)}
          showMobile={false}
          className="hidden md:block w-[220px] shrink-0"
        />
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <p className="text-center text-[13px] text-zinc-500 py-16">
              No products match these filters.
            </p>
          ) : (
            <motion.div
              key={`${active}-${selectedCat}`}
              layout
              variants={reduced ? undefined : staggerVariants}
              initial={reduced ? false : "hidden"}
              animate={reduced ? undefined : "visible"}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
            >
              <AnimatePresence>
                {filtered.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    variants={reduced ? undefined : cardVariants}
                    exit={reduced ? undefined : { opacity: 0, y: -12 }}
                    className={index >= 6 ? "hidden md:block" : undefined}
                  >
                    <ProductCard
                      id={product.id}
                      slug={product.slug}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      images={product.images}
                      condition={product.condition as "new" | "preloved"}
                      conditionGrade={product.conditionGrade}
                      brand={product.brand}
                      stockQuantity={product.stockQuantity}
                      categorySlug={product.category.slug}
                      categoryName={product.category.name}
                      averageRating={product.averageRating}
                      reviews={product.reviews}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-8 md:mt-12 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-zinc-500 hover:text-yellow-500 transition-colors"
        >
          View All
          <span className="text-sm">&#8594;</span>
        </Link>
      </div>
    </section>
  );
}
