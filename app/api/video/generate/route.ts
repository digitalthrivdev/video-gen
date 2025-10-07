import { NextRequest } from "next/server";
import { generateVeo3Video, validateVeo3Request, getKieCredits } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      imageUrl,
      aspectRatio = "9:16",
      model = "veo3_fast",
      enableFallback = false,
      enableTranslation = true,
      seeds,
      callBackUrl,
      watermark,
    } = body || {};

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const apiKey = process.env.VEO3_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "VEO3_API_KEY not configured" }, { status: 500 });
    }

    // Check Kie API credits before proceeding
    try {
      const kieCredits = await getKieCredits(apiKey);
      console.log(`Kie API credits available: ${kieCredits}`);
      
      if (kieCredits < 1) {
        return Response.json({ 
          error: "Insufficient Kie API credits. Please add credits to your Kie account." 
        }, { status: 402 });
      }
    } catch (error: any) {
      console.error('Failed to check Kie credits:', error);
      return Response.json({ 
        error: "Failed to verify Kie API credits. Please try again." 
      }, { status: 500 });
    }

    const request = {
      prompt,
      imageUrls: imageUrl ? [imageUrl] : [],
      aspectRatio,
      model,
      enableFallback,
      enableTranslation,
      seeds,
      callBackUrl,
      watermark,
    } as any;

    validateVeo3Request(request);

    const result = await generateVeo3Video(request, apiKey);
    
    // Store video record in database and deduct tokens
    if (result?.data?.taskId) {
      const tokensToDeduct = 10; // 10 tokens per video generation
      
      // Check if user has enough tokens
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tokens: true }
      });
      
      if (!user || user.tokens < tokensToDeduct) {
        return Response.json({ 
          error: "Insufficient tokens. You need at least 10 tokens to generate a video." 
        }, { status: 402 });
      }
      
      // Create video and deduct tokens in a transaction
      await prisma.$transaction(async (tx) => {
        // Create video record
        const video = await tx.video.create({
          data: {
            userId: session.user.id,
            prompt,
            aspectRatio,
            seed: seeds || 0,
            imageUrl: imageUrl || null,
            videoUrl: 'https://placeholder.com/video.mp4', // Placeholder URL - will be updated when video is completed
            videoId: result.data.taskId,
            status: 'generating',
            tokensUsed: tokensToDeduct
          }
        });
        
        console.log('Created video record:', {
          id: video.id,
          taskId: video.videoId,
          prompt: video.prompt,
          status: video.status,
          userId: video.userId
        });
        
        // Deduct tokens from user
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            tokens: {
              decrement: tokensToDeduct
            }
          }
        });
      });
    }
    
    return Response.json({ taskId: result?.data?.taskId }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error?.message || "Failed to start generation" }, { status: 500 });
  }
}


