"use client";

import { useState } from "react";
import AddToCartButton from "@/components/ui/AddToCartButton";
import { usePolling } from "@/lib/usePolling";
import type { ProductCardProps } from "@/types";

interface BuyAreaProps {
  product: ProductCardProps;
  initialStock: number;
}

const stockPillClass =
  "border border-red-500 text-red-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full";
const conditionPillClass =
  "bg-yellow-400 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full";

export default function BuyArea({ product, initialStock }: BuyAreaProps) {
  const [stock, setStock] = useState(initialStock);

  usePolling(async () => {
    try {
      const res = await fetch(`/api/products/${product.id}/stock`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.stockQuantity === "number") {
        setStock(data.stockQuantity);
      }
    } catch {
      // Keep the last known stock level.
    }
  }, 30_000);

  const inStock = stock > 0;

  return (
    <>
      <div className="flex flex-row gap-2 mt-3">
        {!inStock && <span className={stockPillClass}>OUT OF STOCK</span>}
        {stock === 1 && <span className={stockPillClass}>ONLY 1 LEFT</span>}
        {stock >= 2 && stock <= 3 && (
          <span className={stockPillClass}>LOW STOCK — {stock} LEFT</span>
        )}
        <span className={conditionPillClass}>
          {product.condition === "new" ? "NEW" : "PRELOVED"}
        </span>
      </div>

      <div className="mt-8 flex flex-col gap-3 max-md:hidden">
        {inStock && <AddToCartButton product={product} />}
      </div>
    </>
  );
}
