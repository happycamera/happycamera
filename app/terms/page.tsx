import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions — Happy Camera",
  description: "Happy Camera terms and conditions.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A] mb-6">
        Terms &amp; Conditions
      </h1>
      <div className="prose prose-sm prose-neutral max-w-none text-[#666] leading-relaxed space-y-4">
        <p>
          Welcome to Happy Camera. By accessing or using our website, you
          agree to be bound by the following Terms and Conditions. Please
          read them carefully before using our site or making a purchase.
        </p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">1. General</h2>
        <p>
          These terms apply to all visitors and users of Happy Camera. We
          reserve the right to change, modify, or remove any part of these
          Terms at any time without prior notice. Violation of these terms
          may result in suspension or termination of your access to our
          website or services.
        </p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">
          2. Site Content &amp; Copyright
        </h2>
        <p>
          Unless otherwise stated, all materials on this website — including
          images, designs, icons, photographs, and written content — belong
          to Happy Camera and are protected by copyright and trademark laws.
          They may not be reproduced, distributed, or used commercially
          without our prior written consent.
        </p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">
          3. Comments &amp; Feedback
        </h2>
        <p>
          Any comments, suggestions, or feedback you submit to us may be used
          by Happy Camera. You&rsquo;re responsible for ensuring your
          submissions don&rsquo;t infringe on any third party&rsquo;s rights,
          and unlawful, abusive, or obscene content is strictly prohibited.
        </p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">
          4. Product Information
        </h2>
        <p>
          While we strive for accuracy, product images and colors may vary
          slightly from the actual item due to differences in photography,
          lighting, and display settings — this is especially true for
          preloved gear, where each unit is individually inspected and
          graded. We cannot guarantee your screen will represent every
          product perfectly.
        </p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">
          5. Newsletter Subscription
        </h2>
        <p>
          By registering with us, you agree that Happy Camera may email you
          about new products, promotions, or updates. You can unsubscribe
          anytime using the link in any email.
        </p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">
          6. Responsibility for Losses and Damages
        </h2>
        <p>
          By using our website, you agree to cover and protect Happy Camera
          from any legal claims, damages, or losses caused by your use of the
          site or your failure to follow these Terms.
        </p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">
          7. Links to Other Websites
        </h2>
        <p>
          Our site may link to external websites operated by third parties.
          Accessing these links is at your own risk — Happy Camera
          isn&rsquo;t responsible for their content, security, or data
          practices.
        </p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">
          8. Inaccuracies, Returns &amp; Exchanges
        </h2>
        <p>
          Occasionally our website may contain typographical errors or
          inaccuracies in product descriptions, pricing, or availability. We
          reserve the right to correct these without prior notice. If
          you&rsquo;re not satisfied with a purchase due to incorrect
          information, please see our{" "}
          <Link
            href="/returns"
            className="underline underline-offset-2 text-[#1A1A1A]"
          >
            Return and Exchange Policy
          </Link>{" "}
          for how we can help.
        </p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">9. Termination</h2>
        <p>
          This agreement remains in effect until terminated by either you or
          Happy Camera. You may stop using our services at any time. We
          reserve the right to suspend or terminate access for anyone who
          violates these Terms.
        </p>

        <h2 className="text-[#1A1A1A] font-semibold mt-6">10. Contact Us</h2>
        <p>
          If you have questions about these Terms, contact us at{" "}
          <a
            href="mailto:happycamerabusiness@gmail.com"
            className="underline underline-offset-2 text-[#1A1A1A]"
          >
            happycamerabusiness@gmail.com
          </a>{" "}
          or 016-320 8864.
        </p>

        <p className="text-xs text-[#888] pt-8">Last updated: September 2026</p>
      </div>
    </div>
  );
}