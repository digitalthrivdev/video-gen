import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ 
        error: "Missing required field: orderId" 
      }, { status: 400 });
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderId: orderId },
      include: { package: true }
    });

    if (!order) {
      return NextResponse.json({ 
        error: "Order not found" 
      }, { status: 404 });
    }

    // Fetch payment status from Cashfree
    let paymentStatus = 'pending';
    let paymentMethod = null;
    let failureReason = null;

    try {
      const cashfreeResponse = await fetch(`https://sandbox.cashfree.com/pg/links/${orderId}`, {
        method: 'GET',
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': process.env.CASHFREE_APP_ID!,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
          'Content-Type': 'application/json'
        }
      });

      if (cashfreeResponse.ok) {
        const cashfreeData = await cashfreeResponse.json();
        paymentStatus = cashfreeData.link_status?.toLowerCase() || 'pending';
        
        // If payment is successful, get payment details
        if (paymentStatus === 'paid') {
          // Fetch payment details
          const paymentResponse = await fetch(`https://sandbox.cashfree.com/pg/orders/${orderId}/payments`, {
            method: 'GET',
            headers: {
              'x-api-version': '2023-08-01',
              'x-client-id': process.env.CASHFREE_APP_ID!,
              'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
              'Content-Type': 'application/json'
            }
          });

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            if (paymentData.length > 0) {
              paymentMethod = paymentData[0].payment_method;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching payment status from Cashfree:', error);
      // Continue with processing even if Cashfree API fails
    }

    // Determine final status
    const status = paymentStatus === 'paid' ? 'success' : 'failed';

    // Check if payment already exists
    let payment = await prisma.payment.findUnique({
      where: { orderId: orderId }
    });

    if (payment) {
      return NextResponse.json({ 
        success: true,
        alreadyProcessed: true,
        payment: {
          id: payment.id,
          orderId: payment.orderId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          paymentTime: payment.paymentTime?.toISOString()
        },
        order: {
          id: order.id,
          orderId: order.orderId,
          status: order.status,
          packageName: order.planName,
          tokensAdded: order.package?.tokens || 0
        },
        user: {
          tokens: (await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { tokens: true }
          }))?.tokens || 0
        }
      });
    }

    // Create payment record
    payment = await prisma.payment.create({
      data: {
        orderId: orderId, // Cashfree order ID for reference
        orderInternalId: order.id, // Internal order ID for foreign key
        amount: order.amount,
        currency: order.currency,
        status: status,
        paymentMethod: paymentMethod,
        paymentTime: status === 'success' ? new Date() : null,
        failureReason: failureReason
      }
    });

    // If payment is successful, add tokens to user
    if (status === 'success' && order.package) {
      await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'completed' }
        });

        // Add tokens to user
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            tokens: {
              increment: order.package.tokens
            }
          }
        });
      });
    } else {
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'failed' }
      });
    }

    // Get updated user tokens
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tokens: true }
    });

    return NextResponse.json({
      success: status === 'success',
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        paymentTime: payment.paymentTime?.toISOString(),
        failureReason: payment.failureReason
      },
      order: {
        id: order.id,
        orderId: order.orderId,
        status: order.status,
        packageName: order.planName,
        tokensAdded: status === 'success' ? (order.package?.tokens || 0) : 0
      },
      user: {
        tokens: updatedUser?.tokens || 0
      },
      message: status === 'success' 
        ? 'Payment verified successfully' 
        : 'Payment verification failed'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
