"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  images: string[];
  name: string;
}

export default function Gallery({ images, name }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const validImages = images.filter((img) => img.startsWith("https://"));

  if (validImages.length === 0) {
    return (
      <div className="w-full aspect-square md:h-[480px] bg-[#f5f5f5] flex items-center justify-center rounded-[2px]">
        <span className="text-xs text-gray-400 uppercase tracking-widest">No image</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="w-full aspect-square md:h-[480px] bg-[#f5f5f5] relative flex items-center justify-center overflow-hidden rounded-[2px]">
        <Image
          src={validImages[activeIndex] || validImages[0]}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain object-center p-1"
          loading={activeIndex === 0 ? "eager" : "lazy"}
          quality={90}
        />
      </div>

      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {validImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-[64px] h-[64px] shrink-0 overflow-hidden transition-all duration-200 ${
                i === activeIndex
                  ? "border-2 border-[#1A1A1A]"
                  : "border border-[var(--color-border)] opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                width={64}
                height={64}
                sizes="64px"
                quality={80}
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
