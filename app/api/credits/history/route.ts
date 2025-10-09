import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Fetch token additions (successful orders)
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: 'completed'
      },
      include: {
        package: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch video generations
    const videos = await prisma.video.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch image generations
    const images = await prisma.image.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Combine and format transactions
    const transactions: any[] = [];

    // Add credit additions from orders
    orders.forEach(order => {
      transactions.push({
        id: order.id,
        type: 'credit',
        amount: order.package?.tokens || 0,
        description: `Purchased ${order.planName} package`,
        createdAt: order.createdAt,
        details: {
          packageName: order.planName,
          price: order.amount,
          currency: order.currency
        }
      });
    });

    // Add credit usage from videos
    videos.forEach(video => {
      transactions.push({
        id: video.id,
        type: 'debit',
        amount: video.tokensUsed,
        description: 'Video generation',
        createdAt: video.createdAt,
        details: {
          prompt: video.prompt.substring(0, 100),
          status: video.status,
          aspectRatio: video.aspectRatio
        }
      });
    });

    // Add credit usage from images
    images.forEach(image => {
      transactions.push({
        id: image.id,
        type: 'debit',
        amount: image.tokensUsed,
        description: 'Image generation',
        createdAt: image.createdAt,
        details: {
          prompt: image.prompt.substring(0, 100),
          aspectRatio: image.aspectRatio
        }
      });
    });

    // Sort by date descending
    transactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const paginatedTransactions = transactions.slice(skip, skip + limit);

    // Calculate total credits added and used
    const totalCreditsAdded = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCreditsUsed = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: transactions.length,
        totalPages: Math.ceil(transactions.length / limit)
      },
      summary: {
        totalCreditsAdded,
        totalCreditsUsed,
        currentBalance: (session.user as any).tokens || 0
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching credit history:', error);
    return NextResponse.json({ 
      error: "Failed to fetch credit history" 
    }, { status: 500 });
  }
}

