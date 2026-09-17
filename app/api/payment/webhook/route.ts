import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const signature = request.headers.get("X-Signature");

  if (!signature) {
    console.error("CHIP webhook: missing X-Signature");
    return new Response("Missing signature", { status: 401 });
  }

  // Get the current public key directly from CHIP
  let publicKeyPem: string;

  try {
    const keyResponse = await fetch(
      "https://gate.chip-in.asia/api/v1/public_key/",
      {
        headers: {
          Authorization: `Bearer ${process.env.CHIP_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!keyResponse.ok) {
      console.error(
        "CHIP webhook: failed to retrieve public key",
        keyResponse.status
      );
      return new Response("Unable to retrieve public key", {
        status: 500,
      });
    }

  const keyText = await keyResponse.text();

console.log("CHIP public key check:", {
  first30: keyText.substring(0, 30),
  length: keyText.length,
  contentType: keyResponse.headers.get("content-type"),
});

publicKeyPem = keyText.trim();
  } catch (error) {
    console.error("CHIP webhook: public key request failed", error);
    return new Response("Unable to retrieve public key", {
      status: 500,
    });
  }

  // Verify CHIP signature
  let isValid = false;

  try {
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(Buffer.from(rawBody, "utf-8"));
    verifier.end();

    isValid = verifier.verify(publicKeyPem, signature, "base64");
  } catch (error) {
    console.error("CHIP webhook: signature verification threw:", error);
    return new Response("Signature verification failed", {
      status: 401,
    });
  }

  if (!isValid) {
    console.error("CHIP webhook: invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  // Read CHIP payment data
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventType = payload.event_type as string | undefined;

  if (eventType !== "purchase.paid") {
    return new Response("OK", { status: 200 });
  }

  const chipPurchaseId = payload.id as string | undefined;

  if (!chipPurchaseId) {
    return new Response("Missing purchase id", { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      paymentReference: chipPurchaseId,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    console.error(
      `CHIP webhook: no order found for paymentReference=${chipPurchaseId}`
    );
    return new Response("Order not found", { status: 404 });
  }

  if (order.status === "PAID") {
    return new Response("OK", { status: 200 });
  }

  const oversoldItems: {
    productId: string;
    requested: number;
    available: number;
  }[] = [];

  await prisma.$transaction(async (tx) => {
    const currentOrder = await tx.order.findFirst({
      where: {
        id: order.id,
        status: { not: "PAID" },
      },
      include: {
        items: true,
      },
    });

    if (!currentOrder) return;

    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });

    for (const item of currentOrder.items) {
      if (!item.productId) continue;

      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          stockQuantity: {
            gte: item.quantity,
          },
        },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });

      if (result.count === 0) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true },
        });

        oversoldItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: product?.stockQuantity ?? 0,
        });
      }
    }
  });

  if (oversoldItems.length > 0) {
    console.error(
      "CHIP webhook: oversold items",
      oversoldItems
    );
  }

  await sendOrderConfirmationEmail({
    to: order.customerEmail,
    customerName: order.customerName,
    orderNumber: order.orderNumber || "",
    totalAmount: order.totalAmount,
  });

  console.log(
    `CHIP webhook: order ${order.orderNumber} marked PAID`
  );

  return new Response("OK", { status: 200 });
}
