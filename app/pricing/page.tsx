"use client"

import { useEffect, useState } from "react";
import { VideoIcon, CreditCard, History, Zap, CheckCircle, AlertCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthButton } from "@/components/auth/auth-button";
import { UserInfoBadge } from "@/components/auth/user-info";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface TokenPackage {
  id: string;
  name: string;
  description: string;
  tokens: number;
  price: number;
  currency: string;
  isActive: boolean;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentTime: string;
  failureReason?: string;
  order: {
    planName: string;
  };
}


const BillingPage = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Token packages data
  const tokenPackages: TokenPackage[] = [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for trying out video generation",
      tokens: 10,
      price: 150,
      currency: "INR",
      isActive: true
    },
    {
      id: "growth",
      name: "Growth",
      description: "Great for content creators and small businesses",
      tokens: 50,
      price: 650,
      currency: "INR",
      isActive: true
    },
    {
      id: "pro",
      name: "Pro",
      description: "Best value for regular users",
      tokens: 120,
      price: 1440,
      currency: "INR",
      isActive: true
    },
    {
      id: "agency",
      name: "Agency",
      description: "For heavy usage and teams",
      tokens: 300,
      price: 3300,
      currency: "INR",
      isActive: true
    }
  ];

  useEffect(() => {
    if (session?.user?.id) {
      fetchPaymentHistory();
    }
    setPackages(tokenPackages);
    setLoading(false);
  }, [session]);

  // Redirect to payment success page if order_id is present
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (orderId && session?.user?.id) {
      // Redirect to payment success page for verification
      window.location.href = `/payment/success?order_id=${orderId}`;
    }
  }, [searchParams, session]);

  // Check if user just came back from payment and refresh if needed
  useEffect(() => {
    const checkForPaymentReturn = () => {
      // Check if there's a payment success flag in localStorage
      const paymentSuccess = localStorage.getItem('payment_success');
      if (paymentSuccess === 'true') {
        // Clear the flag
        localStorage.removeItem('payment_success');
        // Force page reload to get updated session
        window.location.reload();
      }
    };

    if (session?.user?.id) {
      checkForPaymentReturn();
    }
  }, [session?.user?.id]);

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch('/api/payment', {
        headers: {
          'Authorization': `Bearer ${session?.user?.id}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const refreshTokens = async () => {
    setRefreshing(true);
    try {
      // Simple page reload to refresh session and tokens
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      setError('Failed to refresh tokens. Please try again.');
      setRefreshing(false);
    }
  };


  const handlePurchase = async (pkg: TokenPackage) => {
    if (!session?.user?.id) {
      setError('Please log in to purchase tokens');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.id}`
        },
        body: JSON.stringify({
          packageId: pkg.id,
          packageName: pkg.name,
          tokens: pkg.tokens,
          amount: pkg.price,
          currency: pkg.currency
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Cashfree payment page
        window.location.href = data.paymentUrl;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Error creating payment order:', error);
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-neutral-400">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fixed Navbar */}
      <div className="fixed top-0 inset-x-0 z-50 border-b bg-white/70 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-left">
            <VideoIcon className="h-5 w-5" />
            <span className="text-lg font-semibold">Vimeo AI</span>
          </Link>
          {/* Right: user info + auth */}
          <div className="flex items-center gap-4">
            <Link href="/videos" className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white">
              My Videos
            </Link>
            <UserInfoBadge />
            <AuthButton />
          </div>
        </div>
      </div>

      <div className="min-h-screen pt-20 pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Billing & Tokens
            </h1>
            <p className="text-xl text-gray-600 dark:text-neutral-400">
              Recharge your tokens to continue generating amazing videos
            </p>
          </div>

          {/* Current Token Balance */}
          {session?.user && (
            <div className="mb-8">
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Current Balance
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        Available tokens for video generation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {(session.user as any).tokens || 0}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshTokens}
                        disabled={refreshing}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-neutral-400">
                      tokens
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}



          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Token Packages */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Choose Your Token Package
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((pkg, index) => {
                const videos = Math.floor(pkg.tokens / 10); // 10 tokens per video
                const effectivePricePerVideo = Math.round(pkg.price / videos);
                const savings = index === 0 ? 0 : Math.round(((150 - effectivePricePerVideo) / 150) * 100);
                
                return (
                  <Card key={pkg.id} className={`p-6 hover:shadow-lg transition-shadow duration-200 ${index === 2 ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}>
                    <div className="text-center">
                      {index === 2 && (
                        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full mb-3 inline-block">
                          Most Popular
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {pkg.name}
                      </h3>
                      <p className="text-gray-600 dark:text-neutral-400 mb-4 text-sm">
                        {pkg.description}
                      </p>
                      <div className="mb-4">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          ₹{pkg.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-neutral-400 mb-2">
                          {pkg.tokens} credits • ~{videos} videos
                        </div>
                        <div className="text-xs text-gray-500 dark:text-neutral-500">
                          ₹{effectivePricePerVideo}/video
                          {savings > 0 && (
                            <span className="ml-1 text-green-600 dark:text-green-400 font-medium">
                              ({savings}% off)
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handlePurchase(pkg)}
                        disabled={processingPayment}
                        className={`w-full ${index === 2 ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      >
                        {processingPayment ? (
                          <div className={`flex items-center gap-2 ${index === 2 ? 'text-white' : ''}`}>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </div>
                        ) : (
                          <div className={`flex items-center gap-2 ${index === 2 ? 'text-white' : ''}`}>
                            <CreditCard className="h-4 w-4" />
                            Purchase
                          </div>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Payment History
            </h2>
            {paymentHistory.length === 0 ? (
              <Card className="p-8 text-center">
                <History className="h-12 w-12 text-gray-400 dark:text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Payment History
                </h3>
                <p className="text-gray-600 dark:text-neutral-400">
                  Your payment history will appear here after your first purchase.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <Card key={payment.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg">
                          <CreditCard className="h-5 w-5 text-gray-600 dark:text-neutral-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {payment.order.planName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-neutral-400">
                            {payment.paymentTime ? new Date(payment.paymentTime).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ₹{payment.amount}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(payment.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(payment.status)}
                              <span className="text-xs">{payment.status}</span>
                            </div>
                          </Badge>
                        </div>
                        {payment.failureReason && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {payment.failureReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BillingPage;
