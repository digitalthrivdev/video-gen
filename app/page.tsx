"use client";

import { useSession } from "next-auth/react";
import { Video, Image as ImageIcon, CreditCard, TrendingUp, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  totalVideos: number;
  totalImages: number;
  tokensUsed: number;
  currentTokens: number;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const [videosRes, imagesRes] = await Promise.all([
        fetch('/api/videos/list'),
        fetch('/api/images/list')
      ]);

      const videosData = await videosRes.json();
      const imagesData = await imagesRes.json();

      const tokensUsed = 
        (videosData.videos || []).reduce((sum: number, v: any) => sum + (v.tokensUsed || 0), 0) +
        (imagesData.images || []).reduce((sum: number, i: any) => sum + (i.tokensUsed || 0), 0);

      setStats({
        totalVideos: videosData.pagination?.total || 0,
        totalImages: imagesData.pagination?.total || 0,
        tokensUsed,
        currentTokens: (session?.user as any).tokens || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Landing page for non-logged in users
  if (status === "unauthenticated" || !session) {
    return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-20 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Create Stunning AI Videos & Images
              </h1>
              <p className="text-xl text-gray-600 dark:text-neutral-400 mb-8 max-w-3xl mx-auto">
                Transform your ideas into reality with cutting-edge AI technology. Generate professional videos and images in seconds.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Powerful AI Tools at Your Fingertips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                  <Video className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  AI Video Generation
                </h3>
                <p className="text-gray-600 dark:text-neutral-400">
                  Create professional 8-second videos from text prompts using Google Veo3 technology.
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex p-4 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
                  <ImageIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Image Generation
                </h3>
                <p className="text-gray-600 dark:text-neutral-400">
                  Generate stunning images from text or transform existing images with AI guidance.
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex p-4 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                  <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Fast & Affordable
                </h3>
                <p className="text-gray-600 dark:text-neutral-400">
                  Pay only for what you use with our credit-based system. Starting from just ₹150.
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Create Something Amazing?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of creators using AI to bring their ideas to life.
            </p>
            <Link href="/auth/signin">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Start Creating Now
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard for logged-in users
  return (
    <div className="min-h-screen pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {session.user?.name}!
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Here's what's happening with your account
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-12 bg-gray-200 dark:bg-neutral-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-neutral-700 rounded"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Current Tokens</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.currentTokens || 0}
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Videos Generated</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalVideos || 0}
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <ImageIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Images Generated</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalImages || 0}
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">Tokens Used</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.tokensUsed || 0}
              </p>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/video">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Generate Video</h3>
                    <p className="text-sm text-gray-600 dark:text-neutral-400">10 tokens per video</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/images">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <ImageIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Generate Image</h3>
                    <p className="text-sm text-gray-600 dark:text-neutral-400">1 token per image</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/pricing">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Buy Tokens</h3>
                    <p className="text-sm text-gray-600 dark:text-neutral-400">Starting from ₹150</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Low Balance Warning */}
        {stats && stats.currentTokens < 10 && (
          <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-4">
              <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                  Low Token Balance
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  You have {stats.currentTokens} tokens remaining. Purchase more to continue creating.
                </p>
              </div>
              <Link href="/pricing">
                <Button variant="outline" className="border-yellow-600 text-yellow-600 hover:bg-yellow-100 dark:border-yellow-400 dark:text-yellow-400">
                  Buy Tokens
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
