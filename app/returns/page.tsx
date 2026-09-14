import type { Metadata } from "next";
import { POLICIES } from "@/lib/policies";

export const metadata: Metadata = {
  title: "Returns & Exchanges — Happy Camera",
  description: "Happy Camera exchange and warranty policy.",
};

export default function ReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A] mb-6">Returns & Exchanges</h1>
      <div className="prose prose-sm prose-neutral max-w-none text-[#666] leading-relaxed space-y-4">
        <h2 className="text-[#1A1A1A] font-semibold mt-6">Exchange Policy</h2>
        <p>{POLICIES.exchangePolicy.intro}</p>
        <ul className="list-disc pl-5 space-y-1">
          {POLICIES.exchangePolicy.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">Shop Warranty</h2>
        <p>{POLICIES.warranty.coverageHeading}</p>
        <ul className="list-disc pl-5 space-y-1">
          {POLICIES.warranty.tiers.map((tier, i) => (
            <li key={i}>{tier}</li>
          ))}
        </ul>
        <p>{POLICIES.warranty.coverage}</p>
        <p>{POLICIES.warranty.notCoveredHeading}</p>
        <ul className="list-disc pl-5 space-y-1">
          {POLICIES.warranty.notCovered.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p>{POLICIES.warranty.careNote}</p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">Exclusions</h2>
        <ul className="list-disc pl-5 space-y-1">
          {POLICIES.exclusions.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">How to Request an Exchange</h2>
        <p>
          To request an exchange, please email{" "}
          <a
            href={`mailto:${POLICIES.howToRequest.email}`}
            className="underline underline-offset-2 text-[#1A1A1A]"
          >
            {POLICIES.howToRequest.email}
          </a>{" "}
          with your order number and a description of the product issue.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          {POLICIES.howToRequest.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <p className="text-xs text-[#888] pt-8">Last Updated: {POLICIES.lastUpdated}</p>
      </div>
    </div>
  );
}