
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderShippedEmail } from "@/lib/email";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, courierName, trackingNumber, trackingEdited } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Deduct stock when a manual bank-transfer order becomes PAID.
    if (
      status === "PAID" &&
      order.status !== "PAID" &&
      order.paymentGateway === "MANUAL_BANK_TRANSFER"
    ) {
      await prisma.$transaction(async (tx) => {
  const claimed = await tx.order.updateMany({
    where: {
      id,
      status: { not: "PAID" },
      paymentGateway: "MANUAL_BANK_TRANSFER",
    },
    data: {
      status: "PAID",
    },
  });

  if (claimed.count === 0) return;

  for (const item of order.items) {
          if (!item.productId) continue;

          if (item.variantId) {
            const result = await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                productId: item.productId,
                stock: { gte: item.quantity },
              },
              data: {
                stock: { decrement: item.quantity },
              },
            });

            if (result.count === 0) {
              throw new Error(
                `Insufficient stock for variant ${item.variantId}`
              );
            }
          } else {
            const result = await tx.product.updateMany({
              where: {
                id: item.productId,
                stockQuantity: { gte: item.quantity },
              },
              data: {
                stockQuantity: { decrement: item.quantity },
              },
            });

            if (result.count === 0) {
              throw new Error(
                `Insufficient stock for product ${item.productId}`
              );
            }
          }
        }

        await tx.order.update({
          where: { id },
          data: { status: "PAID" },
        });
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(status && status !== "PAID" ? { status } : {}),
        ...(courierName !== undefined
          ? { courierName: courierName || null }
          : {}),
        ...(trackingNumber !== undefined
          ? { trackingNumber: trackingNumber || null }
          : {}),
      },
    });

    // Send email when transitioning INTO SHIPPED.
    if (status === "SHIPPED" && order.status !== "SHIPPED") {
      await sendOrderShippedEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        courierName: courierName || order.courierName,
        trackingNumber: trackingNumber || order.trackingNumber,
      });
    }

    // Re-send email when tracking is edited after shipping.
    if (trackingEdited && order.status === "SHIPPED") {
      await sendOrderShippedEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        courierName: courierName || order.courierName,
        trackingNumber: trackingNumber || order.trackingNumber,
        subjectOverride: "Your Order Has Shipped! (Updated Tracking)",
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
