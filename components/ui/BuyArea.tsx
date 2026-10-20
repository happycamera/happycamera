"use client";

import { useState } from "react";
import AddToCartButton from "@/components/ui/AddToCartButton";
import { usePolling } from "@/lib/usePolling";
import type { ProductCardProps } from "@/types";

interface BuyAreaProps {
  product: ProductCardProps;
  initialStock: number;
  variants: {
    id: string;
    color: string;
    price: number | null;
    stock: number;
    images: string[];
  }[];
}

const stockPillClass =
  "border border-red-500 text-red-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full";
const conditionPillClass =
  "bg-yellow-400 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full";

export default function BuyArea({ product, initialStock, variants }: BuyAreaProps) {
  const [stock, setStock] = useState(initialStock);
const [selectedVariantId, setSelectedVariantId] = useState(
  variants[0]?.id ?? ""
);

const selectedVariant = variants.find(
  (v) => v.id === selectedVariantId
);
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
    {variants.length > 0 && (
  <div className="mt-6">
    <p className="mb-3 text-sm font-semibold">
      Select Colour: {selectedVariant?.color}
    </p>

    <div className="flex flex-wrap gap-2">
      {variants.map((variant) => (
        <button
          key={variant.id}
          type="button"
          onClick={() => setSelectedVariantId(variant.id)}
          disabled={variant.stock === 0}
          className={`rounded-lg border px-4 py-2 text-sm ${
            selectedVariantId === variant.id
              ? "border-black bg-black text-white"
              : "border-gray-300 bg-white text-black"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {variant.color} ({variant.stock} left)
        </button>
      ))}
    </div>
  </div>
)}
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
        {(variants.length > 0 ? (selectedVariant?.stock ?? 0) > 0 : inStock) && (
  <AddToCartButton
    product={product}
    variant={selectedVariant}
  />
)}
      </div>
    </>
  );
}
