"use client"

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PaymentVerificationResult {
  success: boolean;
  alreadyProcessed?: boolean;
  payment?: {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    paymentTime: string;
    failureReason?: string;
  };
  order?: {
    id: string;
    orderId: string;
    status: string;
    packageName: string;
    tokensAdded: number;
  };
  user?: {
    tokens: number;
  };
  message?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [verification, setVerification] = useState<PaymentVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    console.log('Payment Success Page - Session state:', { session, orderId, sessionLoading });
    
    if (orderId && session?.user?.id) {
      setSessionLoading(false);
      verifyPayment(orderId);
    } else if (session === null) {
      // Session is loaded but user is not authenticated
      setSessionLoading(false);
      setError('Please log in to verify payment');
      setLoading(false);
    } else if (!orderId) {
      setSessionLoading(false);
      setError('No order ID provided');
      setLoading(false);
    }
    // If session is undefined, keep loading (session is still being fetched)
  }, [orderId, session]);

  // Timeout for session loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sessionLoading && session === undefined) {
        setSessionLoading(false);
        setError('Session loading timeout. Please refresh the page.');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [sessionLoading, session]);

  const verifyPayment = async (orderId: string) => {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.id}`
        },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();

      if (response.ok) {
        setVerification(data);
        
        // Redirect to pricing page after 3 seconds only if payment was successful
        if (data.success) {
          // Set flag to indicate payment success for token refresh
          localStorage.setItem('payment_success', 'true');
          setTimeout(() => {
            router.push('/pricing');
          }, 3000);
        }
      } else {
        setError(data.error || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError('Failed to verify payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToPricing = () => {
    // Set flag to indicate payment success for token refresh
    if (verification?.success) {
      localStorage.setItem('payment_success', 'true');
    }
    router.push('/pricing');
  };

  const handleLogin = () => {
    router.push('/auth/signin');
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">
              {sessionLoading ? 'Loading...' : 'Verifying Payment...'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {sessionLoading 
                ? 'Please wait while we load your session.' 
                : 'Please wait while we process your payment.'
              }
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Payment Verification Failed</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={handleGoToPricing} variant="outline" className="w-full">
                Go to Pricing
              </Button>
              {error.includes('log in') && (
                <Button onClick={handleLogin} className="w-full">
                  Go to Login
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {verification?.success ? (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h2 className="text-xl font-semibold mb-2 text-green-600">Payment Successful!</h2>
              
              {verification?.alreadyProcessed ? (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This payment has already been processed.
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Your payment of ₹{verification?.payment?.amount} has been processed successfully.
                  </p>
                  {verification?.order?.tokensAdded && (
                    <p className="font-medium text-green-600">
                      {verification.order.tokensAdded} tokens have been added to your account!
                    </p>
                  )}
                  {verification?.user?.tokens && (
                    <p className="text-sm text-gray-500">
                      Current balance: {verification.user.tokens} tokens
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Redirecting to pricing page in 3 seconds...
                </p>
                <Button onClick={handleGoToPricing} className="w-full">
                  Go to Pricing Now
                </Button>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h2 className="text-xl font-semibold mb-2 text-red-600">Payment Failed</h2>
              
              <div className="space-y-2 mb-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {verification?.message || 'Your payment could not be verified.'}
                </p>
                {verification?.payment?.failureReason && (
                  <p className="text-sm text-red-600">
                    Reason: {verification.payment.failureReason}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Button onClick={handleGoToPricing} className="w-full">
                  Back to Pricing
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-gray-600 dark:text-gray-400">Please wait...</p>
          </div>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
