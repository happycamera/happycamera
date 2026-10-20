"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useCheckout } from "@/lib/CheckoutContext";
import { computeDeliveryCharge, type DeliveryMethod, type DeliveryRegion } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { bankDetails } from "@/lib/bankDetails";
import { supabase } from "@/lib/supabase";
import StepIndicator from "@/components/checkout/StepIndicator";
import Button from "@/components/ui/Button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { items, hydrated: cartHydrated } = useCart();
  const { info } = useCheckout();

  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"chip" | "bank_transfer">("chip");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryCharge = computeDeliveryCharge(info.deliveryMethod as DeliveryMethod, info.deliveryRegion as DeliveryRegion);
  const total = subtotal + deliveryCharge;

  const ready =
    items.length > 0 &&
    info.customerName.trim() &&
    info.customerEmail.trim() &&
    info.customerPhone.trim() &&
    (info.deliveryMethod === "self_collect" || info.shippingAddress.trim());

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsLoading(false);
        setCheckoutError("");
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    if (!ready) {
      router.replace(items.length === 0 ? "/checkout" : "/checkout/delivery");
    }
  }, [ready, items.length, cartHydrated, router]);

  if (!cartHydrated || !ready) {
    return null;
  }

  const handleReceiptUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setReceiptError("Please select an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setReceiptError("Image must be under 8MB.");
      return;
    }

    if (!supabase) {
      setReceiptError("Upload service unavailable. Please try again.");
      return;
    }

    setReceiptUploading(true);
    setReceiptError("");

    const ext = file.name.split(".").pop();
    const fileName = `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("camera-images")
      .upload(fileName, file);

    if (error) {
      console.error("Receipt upload error:", error);
      setReceiptError("Upload failed. Please try again.");
      setReceiptUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("camera-images")
      .getPublicUrl(data.path);

    setReceiptUrl(urlData.publicUrl);
    setReceiptUploading(false);
  }, []);

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(bankDetails.accountNumber);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = bankDetails.accountNumber;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  const handleProceed = async () => {
    setIsLoading(true);
    setCheckoutError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerName: info.customerName,
          customerEmail: info.customerEmail,
          customerPhone: info.customerPhone,
          shippingAddress: info.shippingAddress,
          deliveryMethod: info.deliveryMethod,
          deliveryRegion: info.deliveryRegion,
          paymentMethod,
          receiptUrl: paymentMethod === "bank_transfer" ? receiptUrl : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.successUrl) {
          window.location.href = data.successUrl;
        } else if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          setCheckoutError("Unexpected response from server.");
          setIsLoading(false);
        }
      } else {
        setCheckoutError(data.error || "Checkout failed. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      setCheckoutError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <StepIndicator currentStep={3} />

      <h1 className="mt-10 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
        Payment
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-8">
        Review your order, then proceed securely to payment.
      </p>

      {/* Order summary */}
      <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
        {items.map((item) => (
          <li key={`${item.productId}-${item.variantId ?? "default"}`} className="flex items-center justify-between py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {item.name}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Qty: {item.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] ml-4">
              {formatPrice(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="border-t border-[var(--color-border)] pt-4 space-y-2 mt-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Subtotal</span>
          <span className="text-[var(--color-text-primary)]">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">
            {info.deliveryMethod === "self_collect" ? "Self Collect" : "Standard Shipping"}
          </span>
          <span className="text-[var(--color-text-primary)]">
            {deliveryCharge === 0 ? "Free" : formatPrice(deliveryCharge)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Total</span>
          <span className="text-xl font-bold text-[var(--color-text-primary)]">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Contact delivery summary */}
      <div className="mt-6 border border-[var(--color-border)] p-5 space-y-1 text-sm">
        <p className="font-semibold text-[var(--color-text-primary)]">{info.customerName}</p>
        <p className="text-[var(--color-text-secondary)]">{info.customerEmail}</p>
        <p className="text-[var(--color-text-secondary)]">{info.customerPhone}</p>
        {info.deliveryMethod === "self_collect" ? (
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Self Collect at Store
          </p>
        ) : (
          <p className="text-xs text-[var(--color-text-secondary)] mt-2 whitespace-pre-wrap">
            {info.shippingAddress}
          </p>
        )}
      </div>

      {checkoutError && (
        <p className="text-xs text-red-500 text-center mt-4">{checkoutError}</p>
      )}

      {/* Payment method */}
      <section className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-tight text-[var(--color-text-primary)] mb-4">
          Payment Method
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPaymentMethod("chip")}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPaymentMethod("chip");
              }
            }}
            className={cn(
              "flex-1 cursor-pointer border p-4 rounded-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]",
              paymentMethod === "chip"
                ? "border-[var(--color-text-primary)] bg-[var(--color-surface)]"
                : "border-[var(--color-border)] hover:border-[var(--color-text-primary)]"
            )}
          >
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              Pay via CHIP
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Instant card / FPX checkout.
            </p>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPaymentMethod("bank_transfer")}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPaymentMethod("bank_transfer");
              }
            }}
            className={cn(
              "flex-1 cursor-pointer border p-4 rounded-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]",
              paymentMethod === "bank_transfer"
                ? "border-[var(--color-text-primary)] bg-[var(--color-surface)]"
                : "border-[var(--color-border)] hover:border-[var(--color-text-primary)]"
            )}
          >
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              Bank Transfer (Manual)
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Pay to our bank account, upload your receipt.
            </p>
          </div>
        </div>

        {paymentMethod === "bank_transfer" && (
          <div className="mt-4 space-y-4">
            {/* Bank details */}
            <div className="border border-[var(--color-border)] p-4 rounded-none">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)] mb-3">
                Bank Details
              </p>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--color-text-secondary)]">Account Name</dt>
                  <dd className="font-medium text-[var(--color-text-primary)]">{bankDetails.accountName}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--color-text-secondary)]">Bank</dt>
                  <dd className="font-medium text-[var(--color-text-primary)]">{bankDetails.bankName}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--color-text-secondary)]">Account Number</dt>
                  <dd className="flex items-center gap-2">
                    <span className="font-mono font-medium text-[var(--color-text-primary)]">
                      {bankDetails.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAccountNumber}
                      aria-label={copied ? "Copied" : "Copy account number"}
                      title={copied ? "Copied" : "Copy account number"}
                      className={cn(
                        "flex items-center justify-center w-9 h-9 -m-1",
                        "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]",
                        "transition-colors"
                      )}
                    >
                      {copied ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Receipt upload */}
            <div className="border border-[var(--color-border)] p-4 rounded-none">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)] mb-3">
                Transfer Receipt
              </p>
              <div>
                {receiptUploading ? (
                  <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                    <span className="inline-block w-4 h-4 border-2 border-[var(--color-text-secondary)] border-t-transparent rounded-full animate-spin" />
                    Uploading receipt...
                  </div>
                ) : receiptUrl ? (
                  <div className="space-y-3">
                    <img
                      src={receiptUrl}
                      alt="Uploaded transfer receipt"
                      className="max-w-full max-h-[240px] object-contain rounded-lg bg-[#f4f4f4]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptUrl("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs text-[var(--color-text-secondary)] underline underline-offset-2 hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      Replace receipt
                    </button>
                  </div>
                ) : (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="w-full text-sm text-[var(--color-text-secondary)] file:mr-3 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-[#F5F5F5] file:text-[var(--color-text-primary)] hover:file:bg-[#E5E5E5] transition-colors cursor-pointer"
                  />
                )}
                {receiptError && (
                  <p className="mt-2 text-xs text-red-500">{receiptError}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {paymentMethod === "chip" && (
        <div className="flex items-center gap-2 pt-5 mt-4">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] bg-gray-100 px-2 py-1">
            FPX
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)] bg-gray-100 px-2 py-1">
            Visa
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)] bg-gray-100 px-2 py-1">
            Mastercard
          </span>
          <span className="text-[10px] text-[var(--color-text-secondary)] ml-auto">
            Secure payment via CHIP
          </span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-8">
        <button
          onClick={() => router.push("/checkout/delivery")}
          className="text-sm font-medium text-center sm:text-left text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-4 transition-colors"
        >
          Back to Delivery
        </button>
        <Button
          variant="primary"
          className="px-8 w-full sm:w-auto"
          onClick={handleProceed}
          disabled={isLoading || (paymentMethod === "bank_transfer" && !receiptUrl)}
          status={isLoading ? "loading" : "idle"}
        >
          {paymentMethod === "bank_transfer" ? "Place Order" : "Proceed to Payment"}
        </Button>
      </div>
    </div>
  );
}
