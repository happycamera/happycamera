
import Image from "next/image";
import Link from "next/link";


const outlets = [
  {
    name: "Happy Camera HQ",
    image: "/images/outlet-hq.jpg",
    location: "",
  },
  {
    name: "Happy Camera Berjaya Times Square",
  image: "/images/Happy Camera Storefront in Mall.png",
    location: "",
  },
];


export default function ClosingCTA() {
  return (
    <section className="bg-[#242424] px-5 py-16 md:px-12 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#FFEB00]">
            Happy Camera Trading
          </p>
          <h2 className="text-3xl font-bold text-white md:text-5xl">
            VISIT OUR STORES
          </h2>
          <p className="mt-3 text-sm text-gray-400">
            Discover your next camera with us.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {outlets.map((outlet) => (
            <div
              key={outlet.name}
              className="overflow-hidden rounded-lg border border-[#444444] bg-[#303030]"
            >
              <div className="relative aspect-[4/3] w-full">
               <Image
  src={outlet.image}
  alt={outlet.name}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  ununoptimized
className="object-cover"
/>
</div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#FFEB00]">
                  {outlet.name}
                </h3>
                <p className="mt-2 text-sm text-gray-300">
                  {outlet.location}
                </p>
                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    outlet.name === "Happy Camera HQ"
                      ? "Happy Camera Trading HQ Kuala Lumpur"
                      : "Happy Camera Berjaya Times Square Kuala Lumpur"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex bg-[#FFEB00] px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
                >
                  VIEW LOCATION ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
