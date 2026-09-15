"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  ShoppingCart,
  MessageSquareText,
  LogOut,
  LayoutDashboard,
  X,
  Menu,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Camera },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showSignOut, setShowSignOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const sidebar = (
    <div className="flex flex-col h-full bg-[#111] text-white">
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3">
          <Camera size={22} className="text-white" />
          <div>
            <p className="text-sm font-bold tracking-tight">Happy Camera</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-yellow-400 opacity-60">
              Admin
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-all",
                isActive
                  ? "bg-white/10 text-white border-l-2 border-white"
                  : "text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-[10px] text-white/40 mb-2 truncate">
          Logged in as {session?.user?.email ?? "Admin"}
        </p>
        <button
          onClick={() => setShowSignOut(true)}
          className="flex items-center gap-3 px-3 py-2 text-sm text-white/60 hover:text-red-400 hover:bg-white/5 rounded-sm transition-all w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <div className="fixed top-0 inset-x-0 z-40 h-14 bg-[#111] flex items-center px-4 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-white hover:bg-white/10 rounded-sm transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <Camera size={18} className="text-white" />
          <p className="text-sm font-bold tracking-tight text-white">
            Happy Camera
          </p>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative h-full">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-1 text-white/60 hover:text-white transition-colors z-10"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
          {sidebar}
        </div>
      </div>

      {/* Desktop sidebar — always visible, in-flow */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-[#111] text-white">
        {sidebar}
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 min-w-0 bg-[var(--color-bg)]",
          "pt-14 md:pt-0" // offset for mobile top bar
        )}
      >
        {children}
      </main>

      <ConfirmModal
        open={showSignOut}
        title="Sign out?"
        message="You'll need to sign back in to access the dashboard."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={() => {
          localStorage.removeItem("happycamera_cart");
          signOut({ callbackUrl: "/admin/login" });
        }}
        onCancel={() => setShowSignOut(false)}
        variant="default"
      />
    </div>
  );
}
