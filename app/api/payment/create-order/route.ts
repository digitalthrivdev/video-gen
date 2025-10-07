import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { packageId, packageName, tokens, amount, currency = "INR" } = body;

    if (!packageId || !packageName || !tokens || !amount) {
      return NextResponse.json({ 
        error: "Missing required fields: packageId, packageName, tokens, amount" 
      }, { status: 400 });
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        packageId: packageId,
        orderId: orderId,
        planName: packageName,
        amount: amount,
        currency: currency,
        status: "pending"
      }
    });

    // Cashfree configuration
    const cashfreeAppId = process.env.CASHFREE_APP_ID;
    const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
    const cashfreeEnvironment = process.env.CASHFREE_ENVIRONMENT || "sandbox";

    if (!cashfreeAppId || !cashfreeSecretKey) {
      return NextResponse.json({ 
        error: "Cashfree configuration missing" 
      }, { status: 500 });
    }

    // Create Cashfree Payment Link
    const cashfreeLinkData = {
      link_id: orderId,
      link_amount: amount,
      link_currency: currency,
      link_purpose: `Payment for ${packageName}`,
      customer_details: {
        customer_name: session.user.name || "User",
        customer_email: session.user.email,
        customer_phone: "9999999999" // Default phone number
      },
      link_meta: {
        return_url: `${process.env.NEXTAUTH_URL}/payment/success?order_id=${orderId}`,
        notify_url: `${process.env.NEXTAUTH_URL}/api/payment/callback`
      },
      link_notify: {
        send_email: true,
        send_sms: false
      }
    };

    // Debug logging
    console.log('Cashfree Payment Link API Request:', {
      url: `https://${cashfreeEnvironment === 'production' ? 'api.cashfree.com' : 'sandbox.cashfree.com'}/pg/links`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2025-01-01',
        'x-client-id': cashfreeAppId,
        'x-client-secret': '***hidden***'
      },
      body: cashfreeLinkData
    });

    const cashfreeResponse = await fetch(
      `https://${cashfreeEnvironment === 'production' ? 'api.cashfree.com' : 'sandbox.cashfree.com'}/pg/links`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2025-01-01',
          'x-client-id': cashfreeAppId,
          'x-client-secret': cashfreeSecretKey
        },
        body: JSON.stringify(cashfreeLinkData)
      }
    );

    if (!cashfreeResponse.ok) {
      const errorData = await cashfreeResponse.json();
      console.error('Cashfree payment link creation failed:', errorData);
      
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "failed" }
      });

      return NextResponse.json({ 
        error: "Failed to create payment link" 
      }, { status: 500 });
    }

    const cashfreeData = await cashfreeResponse.json();
    
    // Debug logging
    console.log('Cashfree Payment Link API Response:', JSON.stringify(cashfreeData, null, 2));

    // Update order with Cashfree link ID
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        orderId: cashfreeData.link_id,
        status: "pending"
      }
    });

    // Get payment URL from the correct field name
    const paymentUrl = cashfreeData.link_url;

    if (!paymentUrl) {
      console.error('No payment URL found in Cashfree response:', cashfreeData);
      return NextResponse.json({ 
        error: "Payment URL not received from payment gateway" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: cashfreeData.link_id,
      paymentUrl: paymentUrl,
      order: {
        id: order.id,
        orderId: cashfreeData.link_id,
        amount: amount,
        currency: currency,
        status: "pending"
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
