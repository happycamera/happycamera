import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderWithOrderNumber } from "@/lib/orderFactory";
import {
  isValidDeliveryMethod,
  isValidDeliveryRegion,
  computeDeliveryCharge,
  type DeliveryMethod,
  type DeliveryRegion,
} from "@/lib/delivery";

function deliveryLabel(method: DeliveryMethod): string {
  return method === "standard" ? "Standard Shipping" : "Self Collect";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      deliveryMethod,
      deliveryRegion,
      paymentMethod,
      receiptUrl,
    } = body;

    if (!items?.length || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof customerEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!isValidDeliveryMethod(deliveryMethod)) {
      return NextResponse.json({ error: "Please choose a delivery method." }, { status: 400 });
    }

    const method: DeliveryMethod = deliveryMethod;

    let region: DeliveryRegion | undefined;
    if (method === "standard") {
      if (!isValidDeliveryRegion(deliveryRegion)) {
        return NextResponse.json(
          { error: "Please choose a delivery region." },
          { status: 400 }
        );
      }
      region = deliveryRegion;
      if (typeof shippingAddress !== "string" || !shippingAddress.trim()) {
        return NextResponse.json(
          { error: "Please enter a shipping address." },
          { status: 400 }
        );
      }
    } else {
      region = undefined;
    }

    const paymentMethodValue = paymentMethod === "bank_transfer" ? "bank_transfer" : "chip";

    if (
      paymentMethodValue === "bank_transfer" &&
      (typeof receiptUrl !== "string" || !receiptUrl.trim())
    ) {
      return NextResponse.json(
        { error: "Please upload your transfer receipt." },
        { status: 400 }
      );
    }

    const deliveryCharge = computeDeliveryCharge(method, region);

   const lineItems: {
  productId: string;
  variantId?: string;
  color?: string;
  quantity: number;
  name: string;
  price: number;
}[] = [];
const requestedStock = new Map<string, number>();
    for (const item of items) {
  if (
    !item ||
    typeof item.productId !== "string" ||
    !Number.isInteger(item.quantity) ||
    item.quantity < 1
  ) {
    return NextResponse.json(
      { error: "Invalid item in cart." },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: item.productId },
    include: { variants: true },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Product not found." },
      { status: 400 }
    );
  }

  if (item.variantId) {
    const variant = product.variants.find(
      (v) => v.id === item.variantId
    );

    if (!variant) {
      return NextResponse.json(
        { error: `Selected colour for "${product.name}" was not found.` },
        { status: 400 }
      );
    }

    const stockKey = `variant:${variant.id}`;
const totalRequested =
  (requestedStock.get(stockKey) ?? 0) + item.quantity;

requestedStock.set(stockKey, totalRequested);

if (variant.stock < totalRequested) {
      return NextResponse.json(
        {
          error: `${product.name} (${variant.color}) only has ${variant.stock} in stock.`,
        },
        { status: 400 }
      );
    }

    lineItems.push({
      productId: product.id,
      variantId: variant.id,
      color: variant.color,
      quantity: item.quantity,
      name: `${product.name} - ${variant.color}`,
      price: variant.price ?? product.price,
    });
  } else {
    if (product.variants.length > 0) {
      return NextResponse.json(
        {
          error: `Please select a colour for "${product.name}" before checkout.`,
        },
        { status: 400 }
      );
    }

    const stockKey = `product:${product.id}`;
const totalRequested =
  (requestedStock.get(stockKey) ?? 0) + item.quantity;

requestedStock.set(stockKey, totalRequested);

if (product.stockQuantity < totalRequested) {
      return NextResponse.json(
        {
          error: `"${product.name}" only has ${product.stockQuantity} in stock. Please reduce the quantity.`,
        },
        { status: 400 }
      );
    }

    lineItems.push({
      productId: product.id,
      quantity: item.quantity,
      name: product.name,
      price: product.price,
    });
  }
}

    const subtotal = lineItems.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );

    const totalAmount = subtotal + deliveryCharge;

    const order = await createOrderWithOrderNumber({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress: method === "standard" ? shippingAddress : null,
      deliveryMethod: method,
      deliveryRegion: region ?? null,
      deliveryCharge,
      totalAmount,
      status: "PENDING",
      ...(paymentMethodValue === "bank_transfer"
        ? { paymentGateway: "MANUAL_BANK_TRANSFER", paymentProofUrl: receiptUrl }
        : {}),
      items: {
  create: lineItems.map((item) => ({
    productId: item.productId,
    variantId: item.variantId ?? null,
    description: item.color ? `Colour: ${item.color}` : null,
    quantity: item.quantity,
    price: item.price,
  })),
},
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (paymentMethodValue === "bank_transfer") {
      return NextResponse.json(
        { successUrl: `${baseUrl}/shop/success?ref=${order.id}` },
        { status: 200 }
      );
    }

    const chipBody = {
      client: {
        email: customerEmail,
        full_name: customerName,
        phone: customerPhone,
      },
      purchase: {
        currency: "MYR",
        products: [
          ...lineItems.map((item) => ({
            name: item.name,
            price: Math.round(item.price * 100),
            quantity: item.quantity,
          })),
          ...(deliveryCharge > 0
            ? [
                {
                  name: deliveryLabel(method),
                  price: Math.round(deliveryCharge * 100),
                  quantity: 1,
                },
              ]
            : []),
        ],
      },
      brand_id: process.env.CHIP_BRAND_ID,
      success_redirect: `${baseUrl}/shop/success?ref=${order.id}`,
      failure_redirect: `${baseUrl}/shop/failed`,
      success_callback: `${baseUrl}/api/payment/webhook`,
      reference: order.id,
    };

    let paymentReference: string | undefined;

    try {
      const chipRes = await fetch("https://gate.chip-in.asia/api/v1/purchases/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CHIP_SECRET_KEY}`,
        },
        body: JSON.stringify(chipBody),
        signal: AbortSignal.timeout(15_000),
      });

      const raw = await chipRes.text();
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.error("CHIP non-JSON response:", raw.slice(0, 500));
        throw new Error("PROVIDER_NON_JSON");
      }

      if (!parsed.id || !parsed.checkout_url) {
        console.error("CHIP error payload:", JSON.stringify(parsed).slice(0, 1000));
        throw new Error("PROVIDER_NO_CHECKOUT_URL");
      }

      paymentReference = parsed.id as string;

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentReference, paymentGateway: "CHIP" },
      });

      return NextResponse.json({ paymentUrl: parsed.checkout_url as string }, { status: 200 });
    } catch (providerErr) {
      const isProviderError =
        providerErr instanceof Error &&
        (providerErr.message === "PROVIDER_NON_JSON" ||
          providerErr.message === "PROVIDER_NO_CHECKOUT_URL" ||
          providerErr.name === "TimeoutError" ||
          providerErr.name === "AbortError" ||
          providerErr.message.includes("fetch"));

      if (isProviderError) {
        try {
          await prisma.$transaction([
            prisma.orderItem.deleteMany({ where: { orderId: order.id } }),
            prisma.order.delete({ where: { id: order.id } }),
          ]);
        } catch (cleanupErr) {
          console.error("Checkout: failed to clean up order after provider error.", {
            orderId: order.id,
            error: cleanupErr,
          });
        }
        return NextResponse.json(
          { error: "Payment provider is temporarily unavailable. Please try again shortly." },
          { status: 503 }
        );
      }
      throw providerErr;
    }
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
