"use client";

import { useState, useCallback } from "react";
import { useCart } from "@/lib/CartContext";
import { formatPrice } from "@/lib/format";
import Button from "@/components/ui/Button";
import type { ProductCardProps } from "@/types";

interface AddToCartButtonProps {
  product: ProductCardProps;
  variant?: {
    id: string;
    color: string;
    price: number | null;
    stock: number;
    images: string[];
  };
}

export default function AddToCartButton({ product, variant }: AddToCartButtonProps) {
  const { addToCart, openCart } = useCart();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleClick = useCallback(() => {
    setStatus("loading");

    addToCart({
  productId: product.id,
  variantId: variant?.id,
  color: variant?.color,
  name: product.name,
  price: variant?.price ?? product.price,
  imageUrl: variant?.images?.[0] || product.images?.[0] || "",
  quantity: 1,
  stockQuantity: variant ? variant.stock : product.stockQuantity,
});

    setTimeout(() => {
      setStatus("success");
      openCart();
      setTimeout(() => setStatus("idle"), 1200);
    }, 400);
 }, [product, variant, addToCart, openCart]);
  return (
    <Button variant="primary" className="w-full" onClick={handleClick} status={status}>
      {status === "loading" ? "Adding..." : status === "success" ? "Added!" : `Add to Cart — ${formatPrice(product.price)}`}
    </Button>
  );
}
