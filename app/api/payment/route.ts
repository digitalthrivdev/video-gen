import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Find user's payments through their orders
    const payments = await prisma.payment.findMany({
      where: {
        order: {
          userId: session.user.id,
        },
      },
      include: {
        order: {
          select: {
            planName: true,
          },
        },
      },
      orderBy: {
        paymentTime: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        paymentTime: payment.paymentTime?.toISOString(),
        failureReason: payment.failureReason,
        order: {
          planName: payment.order.planName,
        },
      })),
    });

  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
