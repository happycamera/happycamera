"use client";

import Link from "next/link";

export default function Footer() {
  return (
   <footer className="bg-[#1D1D1D] border-t border-[#383838]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#FFEB00]">
              Happy Camera
            </h3>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              Secondhand and new camera gear, focused on making
              customers happy. Based in Kuala Lumpur, Malaysia.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-[#FFEB00]">
              Contact
            </h4>
            
<ul className="mt-3 space-y-1 text-xs text-gray-400">
  <li>happycamerabusiness@gmail.com</li>
  <li>SSM: 202103273052 (KT0505042-A)</li>

  <li className="pt-3 font-semibold text-white">
    HQ - KIARA EAST
  </li>
  <li>
    G-01-12 &amp; 17, Kiara East Suite Dex,
    Jalan 3/18a, Taman Mastiara,
    51200 Kuala Lumpur,
    Wilayah Persekutuan Kuala Lumpur
  </li>
  <li>Contact: 016-320 8864</li>

  <li className="pt-3 font-semibold text-white">
    BRANCH 1 - BERJAYA TIMES SQUARE
  </li>
  <li>
    Lot 06-08, Level 6 East Wing,
    Berjaya Times Square, 1 Jalan Imbi,
    55100 Kuala Lumpur
  </li>
  <li>Contact: 012-700 8899</li>
</ul>

          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-[#FFEB00]">
              Info
            </h4>
            <ul className="mt-3 space-y-1.5">
              <li>
                <Link
                  href="/story"
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#333] text-center">
          <p className="text-[10px] text-gray-400">
            &copy; {new Date().getFullYear()} Happy Camera. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
