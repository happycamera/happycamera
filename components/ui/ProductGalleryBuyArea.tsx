
"use client";

import { useState } from "react";
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

      <BuyArea
        product={product}
        initialStock={initialStock}
        variants={variants}
        selectedVariantId={selectedVariantId}
        onVariantChange={setSelectedVariantId}
      />
   </div>
  );
}
