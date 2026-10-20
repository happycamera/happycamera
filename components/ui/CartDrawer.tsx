"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, getSession } from "next-auth/react";
import { X, Trash2, ShoppingBag, Minus, Plus, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/CartContext";
import { formatPrice } from "@/lib/format";
import { materialEase } from "@/lib/motion";

export default function CartDrawer() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, isOpen, closeCart, removeFromCart, updateQuantity } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  const signInTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSignInGate, setShowSignInGate] = useState(false);

  useEffect(() => {
    if (isOpen) scrollRef.current?.scrollTo({ top: 0 });
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (signInTimer.current) clearTimeout(signInTimer.current);
    };
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    closeCart();
    let activeSession = session;
    if (status === "loading") {
      activeSession = await getSession();
    }
    if (activeSession?.user?.provider === "google") {
      router.push("/checkout");
    } else {
      setShowSignInGate(true);
      signInTimer.current = setTimeout(() => {
        void signIn("google", { callbackUrl: "/checkout" });
      }, 850);
    }
  };

  const cancelSignInGate = () => {
    if (signInTimer.current) clearTimeout(signInTimer.current);
    setShowSignInGate(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: materialEase }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={closeCart}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--color-surface)] shadow-2xl z-50 md:flex md:flex-col md:overflow-hidden overflow-y-auto"
            ref={scrollRef}
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                Your Cart
              </h2>
              <button
                onClick={closeCart}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 md:flex-1 md:overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-20 text-center">
                  <ShoppingBag
                    size={40}
                    className="text-[var(--color-text-secondary)] mb-4"
                  />
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Looks like you haven&rsquo;t added anything yet.
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-6 text-sm font-medium text-[var(--color-text-primary)] underline underline-offset-4 hover:no-underline transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.li
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2, ease: materialEase }}
                        className="flex items-center gap-4 py-3 border-b border-[var(--color-border)] last:border-0 overflow-hidden"
                      >
                        <div className="w-16 h-16 bg-gray-100 shrink-0 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center border border-[var(--color-border)] shrink-0">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                                className="h-8 w-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-[13px] font-medium tabular-nums text-[var(--color-text-primary)]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                                disabled={
                                  item.stockQuantity !== undefined &&
                                  item.quantity >= item.stockQuantity
                                }
                                className="h-8 w-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:text-[var(--color-text-secondary)]/40 disabled:cursor-not-allowed transition-colors"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="text-xs text-[var(--color-text-secondary)] truncate">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1.5">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId, item.variantId)}
                          className="p-1.5 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-[var(--color-border)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    Subtotal
                  </span>
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full h-14 bg-[#1A1A1A] text-white text-[15px] font-semibold uppercase tracking-wide hover:bg-[#333] transition-colors rounded-none inline-flex items-center justify-center gap-2"
                >
                  Checkout
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignInGate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: materialEase }}
            className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Google sign-in required for checkout"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: materialEase }}
              className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl"
            >
              <Loader2
                size={28}
                className="mx-auto mb-4 text-[#1A1A1A] animate-spin"
              />
              <h3 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                Checkout requires Google sign-in
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                Your cart is saved. We&rsquo;ll bring you right back to checkout
                after you sign in.
              </p>
              <p className="mt-5 text-[13px] font-medium text-black">
                Redirecting to Google&hellip;
              </p>
              <button
                onClick={cancelSignInGate}
                className="mt-4 text-[13px] font-medium text-[var(--color-text-secondary)] underline underline-offset-4 hover:text-black transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
