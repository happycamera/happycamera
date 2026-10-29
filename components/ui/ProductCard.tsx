"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/lib/WishlistContext";
import { Heart, Eye } from "lucide-react";
import QuickViewModal from "@/components/ui/QuickViewModal";
import type { ProductCardProps } from "@/types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={cn("w-3.5 h-3.5", i <= Math.round(rating) ? "text-yellow-400" : "text-gray-300")}
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductCard({
  id,
  slug,
  name,
  price,
  originalPrice,
  condition,
  conditionGrade,
  images,
  stockQuantity,
  brand,
  averageRating,
  reviews,
  createdAt,
}: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const imageUrl = images?.[0] || "";
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(id);
  const soldOut = stockQuantity !== undefined && stockQuantity <= 0;
  const isOnSale = originalPrice != null && originalPrice > price;

  const isNewArrival =
    createdAt != null &&
    (() => {
      const ageMs = Date.now() - new Date(createdAt).getTime();
      return ageMs >= 0 && ageMs <= 7 * 86400000;
    })();

  const badgeLabel = isOnSale
    ? "ON SALE"
    : soldOut
      ? "SOLD OUT"
      : isNewArrival
        ? "NEW"
        : condition === "new"
          ? "BRAND NEW"
          : `PRELOVED${conditionGrade ? ` · ${conditionGrade}` : ""}`;

  const badgeBg = isOnSale
    ? "bg-red-600"
    : soldOut
      ? "bg-zinc-900"
      : "bg-black";

  const dotColor =
    condition === "new"
      ? "bg-black"
      : conditionGrade === "EXCELLENT"
        ? "bg-[#2D7D46]"
        : conditionGrade === "GOOD"
          ? "bg-[#D89B3C]"
          : conditionGrade === "FAIR"
            ? "bg-[#C4622D]"
            : "bg-zinc-500";

  const productForModal: ProductCardProps = {
    id,
    slug,
    name,
    price,
    originalPrice,
    condition,
    conditionGrade,
    images,
    stockQuantity,
    brand,
    averageRating,
    reviews,
  };

  return (
    <div className="flex flex-col group">
      {/* Image box */}
      <div className={cn("relative aspect-[4/5] md:aspect-square w-full bg-white border border-gray-200 overflow-hidden p-2", soldOut && "opacity-60 grayscale")}>
        <Link href={`/product/${slug}`} className="relative block w-full h-full flex items-center justify-center">
          {imageUrl ? (
            <Image
  src={imageUrl}
  alt={name}
  fill
  sizes="(max-width: 768px) 50vw, 25vw"
  unoptimized
  className="object-contain object-center p-0 md:p-2"
  priority={false}
/>
          ) : (
            <span className="text-xs text-gray-400">No image</span>
          )}
        </Link>

        {/* QUICK VIEW bar — desktop only (hover-reveal); hidden entirely below md */}
        <button
          onClick={() => setQuickViewOpen(true)}
          className={cn(
            "absolute bottom-0 left-0 right-0 z-30 hidden md:flex items-center justify-center",
            "bg-neutral-700/90 text-white text-[11px] font-semibold uppercase tracking-[0.15em] py-4",
            "transition-colors hover:bg-neutral-800",
            "md:opacity-0 md:group-hover:opacity-100 md:translate-y-full md:group-hover:translate-y-0 md:transition-all md:duration-300"
          )}
        >
          Quick View
        </button>

        {/* QUICK VIEW trigger — small icon button, mobile only, bottom-right (away from heart) */}
        <button
          onClick={() => setQuickViewOpen(true)}
          aria-label={`Quick view ${name}`}
          className="absolute bottom-2 right-2 z-30 p-1 bg-white/80 hover:bg-white rounded-none shadow-sm transition-colors md:hidden"
        >
          <Eye size={16} className="h-3.5 w-3.5 stroke-neutral-700" />
        </button>

        {/* Badge */}
        <div className={cn("absolute top-3 left-3 z-30", badgeBg, "text-white text-[10px] font-bold px-2 md:px-2.5 py-1 rounded-[2px] uppercase leading-none whitespace-nowrap")}>
          {badgeLabel}
        </div>

        {/* Wishlist heart — stacked under badge on mobile, top-right on hover (desktop) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(id, { name, price, imageUrl });
          }}
          className={cn(
            "absolute z-30 p-1 md:p-1.5 bg-white/80 hover:bg-white rounded-none shadow-sm transition-all duration-200",
            "top-10 left-3 md:top-3 md:left-auto md:right-3",
            "md:opacity-0 md:group-hover:opacity-100"
          )}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={16}
            className={cn(
              "h-3.5 w-3.5 md:h-4 md:w-4 transition-colors duration-200",
              wishlisted ? "fill-red-500 stroke-red-500" : "stroke-neutral-700 group-hover:stroke-neutral-900"
            )}
          />
        </button>
      </div>

      {/* Info — no border, no background */}
      <Link href={`/product/${slug}`} className="block mt-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <span className={cn("w-[6px] h-[6px] rounded-full shrink-0", dotColor)} />
          <p className="text-xs md:text-[13px] font-medium text-gray-400 uppercase tracking-[0.1em] leading-none">
            {brand}
          </p>
        </div>
        <p className="text-sm md:text-[18px] font-semibold text-neutral-800 line-clamp-2 md:line-clamp-1 leading-[1.3] mb-2 transition-colors duration-200 group-hover:text-black">
          {name}
        </p>

        {averageRating !== null && averageRating !== undefined && (
          <div className="mb-1.5">
            <StarRating rating={averageRating} />
          </div>
        )}

        <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
          <span className="flex items-baseline">
            <span className="text-xs md:text-[14px] font-medium text-gray-400 leading-none">
              RM&nbsp;
            </span>
            <span
              className={cn(
                "text-base md:text-[22px] font-normal leading-none font-serif",
                isOnSale ? "text-red-600" : "text-gray-900"
              )}
            >
              {price.toLocaleString("en-MY")}
            </span>
          </span>
          {isOnSale && (
            <span className="text-[13px] md:text-[14px] font-medium text-gray-400 line-through">
              RM {originalPrice!.toLocaleString("en-MY")}
            </span>
          )}
        </div>
      </Link>

      {/* Quick View Modal */}
      {quickViewOpen && (
        <QuickViewModal
          product={productForModal}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </div>
  );
}
