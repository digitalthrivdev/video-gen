import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Handle POST requests from Cashfree to the callback URL
export async function POST(request: NextRequest) {
  try {
    console.log("📨 POST request to payment callback API");
    console.log("📨 Request URL:", request.url);
    console.log("📨 Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Safe URL parsing with fallback
    let url: URL;
    let searchParams: URLSearchParams;
    
    try {
      const requestUrl = request.url || 'http://localhost:3000';
      url = new URL(requestUrl);
      searchParams = url.searchParams;
    } catch (urlError) {
      console.error("❌ URL parsing error:", urlError);
      // Fallback to localhost
      url = new URL('http://localhost:3000');
      searchParams = new URLSearchParams();
    }
    
    // Get parameters from URL query string AND body
    let orderId = searchParams.get("order_id") || "";
    let status = searchParams.get("status") || "";
    let paymentMethod = searchParams.get("payment_method") || "";
    let failureReason = searchParams.get("failure_reason") || "";
    const developmentMode = searchParams.get("development_mode") || "";

    console.log("🔍 POST Callback parameters:", {
      orderId,
      status,
      paymentMethod,
      failureReason,
      developmentMode,
      fullUrl: request.url
    });

    // Try to get body data as well (Cashfree might send data in body)
    let bodyData: Record<string, unknown> = {};
    try {
      const contentType = request.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        bodyData = await request.json();
      } else if (contentType?.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        bodyData = Object.fromEntries(formData.entries());
      }
      console.log("📄 POST Body data:", bodyData);

      // Use body data if URL params are missing
      if (!orderId && bodyData.order_id) orderId = String(bodyData.order_id);
      if (!status && bodyData.status) status = String(bodyData.status);
      if (!paymentMethod && bodyData.payment_method) paymentMethod = String(bodyData.payment_method);
      if (!failureReason && bodyData.failure_reason) failureReason = String(bodyData.failure_reason);
    } catch {
      console.log("📄 No valid body data");
    }

    // Process payment if we have order ID and status
    if (orderId && status) {
      try {
        // Find the order
        const order = await prisma.order.findUnique({
          where: { orderId: orderId },
          include: { package: true }
        });

        if (order) {
          // Check if payment already exists
          let payment = await prisma.payment.findUnique({
            where: { orderId: orderId }
          });

          if (!payment) {
            // Create payment record
            payment = await prisma.payment.create({
              data: {
                orderId: orderId, // Cashfree order ID for reference
                orderInternalId: order.id, // Internal order ID for foreign key
                amount: order.amount,
                currency: order.currency,
                status: status,
                paymentMethod: paymentMethod || null,
                paymentTime: status === 'success' ? new Date() : null,
                failureReason: failureReason || null
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
                  where: { id: order.userId },
                  data: {
                    tokens: {
                      increment: order.package.tokens
                    }
                  }
                });
              });

              console.log(`✅ Payment successful for order ${orderId}, added ${order.package.tokens} tokens to user ${order.userId}`);
            } else {
              // Update order status to failed
              await prisma.order.update({
                where: { id: order.id },
                data: { status: 'failed' }
              });

              console.log(`❌ Payment failed for order ${orderId}: ${failureReason}`);
            }
          } else {
            console.log(`⚠️ Payment already processed for order ${orderId}`);
          }
        } else {
          console.log(`❌ Order not found: ${orderId}`);
        }
      } catch (dbError) {
        console.error("❌ Database error processing payment:", dbError);
      }
    }

    // Create redirect URL to the pricing page
    const baseUrl = url.origin;
    const redirectUrl = new URL('/pricing', baseUrl);
    
    // Add parameters to the redirect URL
    if (orderId) redirectUrl.searchParams.set('order_id', orderId);
    if (status) redirectUrl.searchParams.set('status', status);
    if (developmentMode) redirectUrl.searchParams.set('development_mode', developmentMode);

    console.log("🔀 Redirecting to:", redirectUrl.toString());

    // Return a redirect response
    return NextResponse.redirect(redirectUrl, { status: 302 });

  } catch (error) {
    console.error("❌ Error in POST callback handler:", error);
    
    // Redirect to pricing page with error
    try {
      const requestUrl = request.url || 'http://localhost:3000';
      console.log("🔍 Request URL:", requestUrl);
      const baseUrl = new URL(requestUrl).origin;
      console.log("🔍 Base URL:", baseUrl);
      const redirectUrl = new URL('/pricing', baseUrl);
      console.log("🔍 Redirect URL:", redirectUrl);
      redirectUrl.searchParams.set('error', 'callback_error');
      redirectUrl.searchParams.set('message', 'Error processing payment callback');
      console.log("🔍 Redirect URL with error:", redirectUrl);
      return NextResponse.redirect(redirectUrl, { status: 302 });
    } catch (redirectError) {
      console.error("❌ Redirect error:", redirectError);
      // Final fallback - simple error response
      return NextResponse.json(
        { error: 'callback_error', message: 'Error processing payment callback' },
        { status: 500 }
      );
    }
  }
}

// Handle GET requests (just redirect to the page)
export async function GET(request: NextRequest) {
  try {
    console.log("📨 GET request to payment callback API");
    console.log("📨 GET Request URL:", request.url);
    
    // Safe URL parsing with fallback
    let url: URL;
    
    try {
      const requestUrl = request.url || 'http://localhost:3000';
      url = new URL(requestUrl);
    } catch (urlError) {
      console.error("❌ GET URL parsing error:", urlError);
      url = new URL('http://localhost:3000');
    }
    
    // For GET requests, redirect to the pricing page with the same parameters
    const baseUrl = url.origin;
    const redirectUrl = new URL('/pricing', baseUrl);
    
    // Copy all search params
    url.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });

    return NextResponse.redirect(redirectUrl, { status: 302 });
    
  } catch (error) {
    console.error("❌ Error in GET callback handler:", error);
    
    // Fallback response
    return NextResponse.json(
      { error: 'callback_error', message: 'Error processing GET callback' },
      { status: 500 }
    );
  }
}