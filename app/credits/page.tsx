"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowDownCircle, ArrowUpCircle, Video, Image, CreditCard, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
  details: any;
}

interface Summary {
  totalCreditsAdded: number;
  totalCreditsUsed: number;
  currentBalance: number;
}

export default function CreditsHistoryPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchCreditHistory();
    }
  }, [session]);

  const fetchCreditHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/credits/history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch credit history');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      setSummary(data.summary);
    } catch (err) {
      console.error('Error fetching credit history:', err);
      setError('Failed to load credit history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (transaction: Transaction) => {
    if (transaction.type === 'credit') {
      return <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
    }
    if (transaction.description.includes('Video')) {
      return <Video className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
    return <Image className="h-5 w-5 text-red-600 dark:text-red-400" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'credit'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  const getTypeBadge = (type: string) => {
    return type === 'credit'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Sign in Required</h2>
          <p className="text-gray-600 dark:text-neutral-400">
            Please sign in to view your credit history.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-neutral-400">Loading credit history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Credit History
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Track your token purchases and usage
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">
                    Current Balance
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {summary.currentBalance}
                  </p>
                </div>
                <CreditCard className="h-10 w-10 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">
                    Total Added
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    +{summary.totalCreditsAdded}
                  </p>
                </div>
                <ArrowUpCircle className="h-10 w-10 text-green-600 dark:text-green-400 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">
                    Total Used
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    -{summary.totalCreditsUsed}
                  </p>
                </div>
                <ArrowDownCircle className="h-10 w-10 text-red-600 dark:text-red-400 opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Transactions List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Transaction History
          </h2>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto text-gray-300 dark:text-neutral-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Transactions Yet
              </h3>
              <p className="text-gray-600 dark:text-neutral-400 mb-4">
                Your credit history will appear here once you purchase tokens or generate content.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Purchase Tokens
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg">
                      {getIcon(transaction)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </p>
                      {transaction.details.prompt && (
                        <p className="text-sm text-gray-500 dark:text-neutral-400 line-clamp-1">
                          {transaction.details.prompt}
                        </p>
                      )}
                      {transaction.details.packageName && (
                        <p className="text-sm text-gray-500 dark:text-neutral-400">
                          {transaction.details.packageName} - ₹{transaction.details.price}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getTypeBadge(transaction.type)}>
                      <span className={`text-lg font-bold ${getTypeColor(transaction.type)}`}>
                        {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                      </span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

