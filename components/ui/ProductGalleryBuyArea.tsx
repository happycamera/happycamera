
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Gallery from "@/components/ui/Gallery";
import BuyArea from "@/components/ui/BuyArea";
import type { ProductCardProps } from "@/types";

interface Variant {
  id: string;
  color: string;
  price: number | null;
  stock: number;
  images: string[];
}

interface Props {
  product: ProductCardProps;
  initialStock: number;
  variants: Variant[];
  images: string[];
  name: string;
}

export default function ProductGalleryBuyArea({
  product,
  initialStock,
  variants,
  images,
  name,
}: Props) {
  const [buyAreaTarget, setBuyAreaTarget] = useState<HTMLElement | null>(null);

useEffect(() => {
  setBuyAreaTarget(document.getElementById("product-buy-area"));
}, []);
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?.id ?? ""
  );

  const selectedVariant = variants.find(
    (variant) => variant.id === selectedVariantId
  );

  const displayImages =
    selectedVariant?.images?.length
      ? selectedVariant.images
      : images;

return (
  <div className="contents">
      <Gallery
        key={selectedVariantId}
        images={displayImages}
        name={name}
      />

 {buyAreaTarget && createPortal(
  <div className="w-full">
  <BuyArea
    product={product}
    initialStock={initialStock}
    variants={variants}
    selectedVariantId={selectedVariantId}
    onVariantChange={setSelectedVariantId}
  />
  </div>,
  buyAreaTarget
)}
   </div>
  );
}
