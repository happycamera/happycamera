"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { cn } from "@/lib/utils";
import type { ProductCardProps } from "@/types";

const PAGE_SIZE = 12;
const LOAD_DELAY_MS = 500;

interface Props {
  products: ProductCardProps[];
}

export default function ProductsGrid({ products }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const allVisible = products.length <= visibleCount;

  const handleLoadMore = () => {
    if (isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount((c) => c + PAGE_SIZE);
      setIsLoading(false);
    }, LOAD_DELAY_MS);
  };

  return (
    <><div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-10">
        {products.map((product, i) => (
          <div
            key={product.id}
            className={cn(i >= visibleCount && "hidden md:block")}
          >
            <ProductCard {...product} />
          </div>
        ))}
      </div>

      {!allVisible && (
        <div className="mt-10 flex justify-center md:hidden">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 border border-[#1A1A1A] bg-white text-[#1A1A1A] text-[12px] font-semibold uppercase tracking-[0.15em] px-6 py-3 transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:text-[#1A1A1A]"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Loading…
              </>
            ) : (
              `Load More (${products.length - visibleCount} more)`
            )}
          </button>
        </div>
      )}
    </>
  );
}
