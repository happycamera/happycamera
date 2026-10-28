"use client";

import { useState, useEffect, useRef } from "react";
import { ZoomIn, X, Plus, Minus } from "lucide-react";
import Image from "next/image";

interface Props {
  images: string[];
  name: string;
}

export default function Gallery({ images, name }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
const [zoomLevel, setZoomLevel] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
const imageContainerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!isZoomOpen) return;

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsZoomOpen(false);
      setZoomLevel(1);
    }
  };

  window.addEventListener("keydown", handleEscape);
  return () => window.removeEventListener("keydown", handleEscape);
}, [isZoomOpen]);
  const validImages = images.filter((img) => img.startsWith("https://"));

  if (validImages.length === 0) {
    return (
     <div
  className="w-full aspect-square md:h-[480px] bg-[#f5f5f5] relative flex items-center justify-center overflow-hidden rounded-[2px] cursor-zoom-in"
  role="button"
  tabIndex={0}
  aria-label="Enlarge product image"
  onClick={() => {
    setZoomLevel(1);
    setIsZoomOpen(true);
  }}
  onKeyDown={(event) => {
    if (event.key === "Enter") {
      setZoomLevel(1);
      setIsZoomOpen(true);
    }
  }}
>
        <span className="text-xs text-gray-400 uppercase tracking-widest">No image</span>
      </div>
    );
  }

  return (
   <div className="relative flex flex-col gap-3 min-w-0">
     <div
  ref={imageContainerRef}
  className="w-full aspect-square md:h-[480px] bg-[#f5f5f5] relative flex items-center justify-center overflow-hidden rounded-[2px]"
  onMouseEnter={() => setIsHovering(true)}
  onMouseLeave={() => setIsHovering(false)}
  onMouseMove={(event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  }}
>
        <Image
          src={validImages[activeIndex] || validImages[0]}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain object-center p-1"
          loading={activeIndex === 0 ? "eager" : "lazy"}
          quality={90}
        /><button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    setZoomLevel(1);
    setIsZoomOpen(true);
  }}
  className="absolute bottom-4 right-4 z-10 rounded-full bg-white p-3 shadow-md hover:bg-gray-100"
  aria-label="Zoom product image"
>
  <ZoomIn size={22} />
</button>
    
      {isHovering && (
  <div
    className="hidden md:block absolute z-30 w-[200px] h-[200px] border-2 border-gray-500 bg-white/20 pointer-events-none"
    style={{
      left: `calc(${mousePosition.x}% - 100px)`,
      top: `calc(${mousePosition.y}% - 100px)`,
    }}
  />
)}
</div>
     {isHovering && (
  <div
    className="hidden lg:block absolute left-[102%] top-0 z-50 w-[400px] h-[400px] border-2 border-gray-400 bg-white shadow-xl pointer-events-none"
    style={{
      backgroundImage: `url("${validImages[activeIndex] || validImages[0]}")`,
      backgroundSize: "250%",
      backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
      backgroundRepeat: "no-repeat",
    }}
  />
)} {validImages.length > 1 && (
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
    {isZoomOpen && (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
    onClick={() => setIsZoomOpen(false)}
    role="dialog"
    aria-modal="true"
    aria-label="Enlarged product image"
  >
    <button
      type="button"
      onClick={() => setIsZoomOpen(false)}
      className="absolute right-5 top-5 z-20 rounded-full bg-white p-3 text-black"
      aria-label="Close zoom"
    >
      <X size={24} />
    </button>

    <div
      className="relative h-[80vh] w-full max-w-5xl overflow-auto"
      onClick={(event) => event.stopPropagation()}
    >
     <Image
  src={validImages[activeIndex] || validImages[0]}
  alt={name}
  fill
  sizes="100vw"
  quality={100}
  className="object-contain"
  style={{
    transform: `scale(${zoomLevel})`,
    transformOrigin: "center center",
  }}
/>
    </div>

    <div
      className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-3"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
        className="rounded-full bg-white p-3 text-black"
        aria-label="Zoom out"
      >
        <Minus size={22} />
      </button>

      <button
        type="button"
        onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))}
        className="rounded-full bg-white p-3 text-black"
        aria-label="Zoom in"
      >
        <Plus size={22} />
      </button>
    </div>
    </div>
)}
</div>
);
}
