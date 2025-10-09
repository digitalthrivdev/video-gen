import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Fetch user's images
    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          prompt: true,
          aspectRatio: true,
          imageUrl: true,
          imageId: true,
          tokensUsed: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.image.count({
        where: { userId: session.user.id }
      })
    ]);

    return Response.json({
      images,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching images:', error);
    return Response.json({ 
      error: error?.message || "Failed to fetch images" 
    }, { status: 500 });
  }
}

