"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ShoppingBag, Heart, User, ChevronDown } from "lucide-react";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { useNavVisibility } from "@/lib/useNavVisibility";
import SearchModal from "@/components/layout/SearchModal";
import MegaMenu from "@/components/layout/MegaMenu";
import type { MegaMenuItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { materialEase } from "@/lib/motion";
import { getMegaMenuImage } from "@/lib/megaMenuImages";

const OVERLAY_DELAY = 50;
const SYNTHETIC_EVENT_WINDOW = 500;
const IGNORE_DOCUMENT_WINDOW = 200;

const Navbar = ({ navMenus }: { navMenus: MegaMenuItem[] }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchOpened = useRef(false);
  const navRoot = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isTouch = useRef(false);
  const lastTouchTime = useRef(0);
  const ignoreNextClose = useRef(false);
  const { openCart, isOpen: cartOpen, items, lastAddedId } = useCart();
  const { openWishlist, isOpen: wishlistOpen, items: wishlistItems } = useWishlist();
  const scrollVisible = useNavVisibility();
  const { data: session, status } = useSession();

  const isVisible =
    scrollVisible ||
    activeMenu !== null ||
    mobileOpen ||
    cartOpen ||
    wishlistOpen;

  useEffect(() => {
    isTouch.current = window.matchMedia("(pointer: coarse)").matches;
  }, []);

  const isSyntheticFromTouch = useCallback(() => {
    return Date.now() - lastTouchTime.current < SYNTHETIC_EVENT_WINDOW;
  }, []);

  useEffect(() => {
    if (!activeMenu) {
      setOverlayVisible(false);
      return;
    }
    const id = setTimeout(() => setOverlayVisible(true), OVERLAY_DELAY);
    return () => clearTimeout(id);
  }, [activeMenu]);

  const scheduleClose = useCallback(() => {
    if (touchOpened.current || isSyntheticFromTouch()) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setActiveMenu(null);
    }, 300);
  }, [isSyntheticFromTouch]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const openMenu = useCallback(
    (title: string) => {
      if (isSyntheticFromTouch()) return;
      cancelClose();
      setActiveMenu(title);
    },
    [cancelClose, isSyntheticFromTouch]
  );

  const closeMenu = useCallback(() => {
    touchOpened.current = false;
    setActiveMenu(null);
    setHoveredLink(null);
  }, []);

  const toggleMenu = useCallback(
    (title: string) => {
      cancelClose();
      setActiveMenu((prev) => {
        if (prev === title) {
          touchOpened.current = false;
          return null;
        }
        touchOpened.current = true;
        ignoreNextClose.current = true;
        setTimeout(() => {
          ignoreNextClose.current = false;
        }, IGNORE_DOCUMENT_WINDOW);
        return title;
      });
    },
    [cancelClose]
  );

  useEffect(() => {
    if (!activeMenu) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ignoreNextClose.current) return;
      const target = e.target as HTMLElement;
      if (navRoot.current && !navRoot.current.contains(target)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [activeMenu, closeMenu]);

  const onTouchStart = useCallback(() => {
    lastTouchTime.current = Date.now();
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <AnimatePresence>
        {activeMenu && overlayVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: materialEase }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      <div
        ref={navRoot}
        className="fixed top-0 inset-x-0 z-50"
        onTouchStart={onTouchStart}
      >
        <motion.div
          animate={{ y: isVisible ? 0 : "-100%" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ willChange: "transform" }}
        >
          <nav className="bg-[#FFEB00] border-b border-black/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 grid grid-cols-3 items-center">
              <div className="flex items-center justify-start gap-6">
                <div className="flex items-center md:hidden">
                  <button
                    className="p-2 text-black -ml-2"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                  >
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>
                  <SearchModal mobileOnly />
                </div>
                <div
                  className="hidden md:flex items-center gap-6"
                  onMouseEnter={cancelClose}
                  onMouseLeave={() => {
                    setHoveredLink(null);
                    scheduleClose();
                  }}
                >
                  <LayoutGroup>
                    {navMenus.map((menu, i) => (
                      <div
                        key={menu.name}
                        className="relative h-20 flex items-center"
                        onMouseEnter={() => {
                          setHoveredLink(i);
                          openMenu(menu.name);
                        }}
                      >
                        <Link
                          href={menu.path}
                          className="text-[14px] font-medium text-black uppercase tracking-[0.12em]"
                        >
                          {menu.name}
                        </Link>
                        <div
                          className="absolute inset-0"
                          onClick={() => toggleMenu(menu.name)}
                        />
                        {hoveredLink === i && (
                          <motion.div
                            layoutId="nav-underline"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </div>
                    ))}
                  </LayoutGroup>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/images/logo-transparent.png"
                    alt="Happy Camera"
                    width={70}
                    height={70}
                    priority
                    quality={100}
                    className="h-14 md:h-[70px] w-auto object-contain"
                  />
                </Link>
              </div>

              <div className="flex items-center justify-end gap-5">
                <SearchModal desktopOnly />
                <div className="relative flex items-center" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      if (!session) {
                        signIn("google");
                      } else {
                        setUserMenuOpen((p) => !p);
                      }
                    }}
                    className="relative text-black group"
                    aria-label={session ? "Account" : "Sign in"}
                  >
                    {status === "loading" ? (
                      <div className="w-[22px] h-[22px] rounded-full bg-zinc-200 animate-pulse" />
                    ) : (
                      <User size={22} />
                    )}
                  </button>
                  {userMenuOpen && session && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white border border-zinc-200 shadow-lg z-50 py-1">
                        <div className="px-4 py-3 border-b border-zinc-100">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {session.user?.name || session.user?.email}
                          </p>
                          <p className="text-xs text-zinc-400 truncate mt-0.5">
                            {session.user?.email}
                          </p>
                        </div>
                        <Link
                          href="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          My Orders
                        </Link>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            localStorage.removeItem("happycamera_cart");
                            signOut();
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={openWishlist}
                  className="relative text-black group"
                  aria-label="Wishlist"
                >
                  <Heart
                    size={22}
                    className={cn(
                      wishlistItems.length > 0 ? "fill-black" : ""
                    )}
                  />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 pointer-events-none" />
                </button>
                <button
                  onClick={openCart}
                  className="relative text-black group"
                  aria-label="Cart"
                >
                  <ShoppingBag size={22} />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 pointer-events-none" />
                  <AnimatePresence mode="popLayout">
                    {totalItems > 0 && (
                      <motion.span
                        key={lastAddedId}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-[#1A1A1A] rounded-full"
                      >
                        {totalItems}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </nav>

          <AnimatePresence>
            {activeMenu && (
              <div
                className="relative z-50"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                {navMenus
                  .filter((m) => m.name === activeMenu)
                  .map((m) => (
                    <MegaMenu key={m.name} menu={m} />
                  ))}
              </div>
            )}
          </AnimatePresence>

          <div
            className={cn(
              "md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white border-t-2 border-yellow-400",
              mobileOpen ? "max-h-[80vh] overflow-y-auto" : "max-h-0"
            )}
          >
            <div className="flex flex-col px-4 py-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center h-11 text-[14px] font-medium text-black uppercase tracking-[0.12em]"
              >
                Home
              </Link>
              <Link
                href="/shop"
                onClick={() => setMobileOpen(false)}
                className="flex items-center h-11 text-[14px] font-medium text-black uppercase tracking-[0.12em]"
              >
                Shop
              </Link>
              <Link
                href="/story"
                onClick={() => setMobileOpen(false)}
                className="flex items-center h-11 text-[14px] font-medium text-black uppercase tracking-[0.12em]"
              >
                News
              </Link>
              <Link
                href="mailto:happycamerabusiness@gmail.com"
                onClick={() => setMobileOpen(false)}
                className="flex items-center h-11 text-[14px] font-medium text-black uppercase tracking-[0.12em]"
              >
                Contact
              </Link>

              <div className="border-t border-zinc-200 my-3" />

              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-1">
                Categories
              </span>

              {navMenus.map((menu) => {
                const isExpanded = expandedCategory === menu.name;
                return (
                  <div key={menu.name}>
                    <button
                      onClick={() =>
                        setExpandedCategory(isExpanded ? null : menu.name)
                      }
                      className="flex items-center justify-between w-full h-11 text-[14px] font-medium text-black uppercase tracking-[0.12em]"
                    >
                      {menu.name}
                      <ChevronDown
                        size={16}
                        className={cn(
                          "text-zinc-400 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <div className="pl-3 pb-2">
                        {menu.subcategories.map((sub) => {
                          const img = getMegaMenuImage(
                            menu.category,
                            sub.name
                          );
                          return (
                            <Link
                              key={sub.name}
                              href={sub.path}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 h-11 text-[13px] text-zinc-600 hover:text-black transition-colors"
                            >
                              {img && (
                                <img
                                  src={img}
                                  alt=""
                                  className="w-8 h-8 rounded object-cover bg-zinc-100 shrink-0"
                                />
                              )}
                              {sub.name}
                            </Link>
                          );
                        })}
                        <Link
                          href={menu.shopAll.path}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center h-11 text-[12px] font-semibold uppercase tracking-[0.15em] text-yellow-600"
                        >
                          {menu.shopAll.title}
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Navbar;
