import { NextRequest } from "next/server";
import { generateSingleImage, generateImageFromImage } from "@/lib/api/fal";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      aspectRatio = "1:1",
      referenceImageUrl,
    } = body || {};

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Validate aspect ratio
    const validAspectRatios = ['16:9', '9:16', '1:1'];
    if (!validAspectRatios.includes(aspectRatio)) {
      return Response.json({ error: "Invalid aspect ratio" }, { status: 400 });
    }

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const tokensToDeduct = 1; // 1 token per image generation
    
    // Check if user has enough tokens
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tokens: true }
    });
    
    if (!user || user.tokens < tokensToDeduct) {
      return Response.json({ 
        error: "Insufficient tokens. You need at least 1 token to generate an image." 
      }, { status: 402 });
    }

    // Check FAL API configuration
    if (!process.env.FAL_API_KEY) {
      return Response.json({ error: "FAL_API_KEY not configured" }, { status: 500 });
    }

    // Generate image using FAL AI
    let imageUrl: string;
    
    if (referenceImageUrl) {
      // Image-to-image generation
      console.log('Using image-to-image generation with reference:', referenceImageUrl);
      imageUrl = await generateImageFromImage(
        prompt,
        referenceImageUrl,
        aspectRatio as '16:9' | '9:16' | '1:1'
      );
    } else {
      // Text-to-image generation
      imageUrl = await generateSingleImage(
        prompt,
        aspectRatio as '16:9' | '9:16' | '1:1'
      );
    }

    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    // Create image record and deduct tokens in a transaction
    const image = await prisma.$transaction(async (tx) => {
      // Create image record
      const newImage = await tx.image.create({
        data: {
          userId: session.user.id,
          prompt,
          aspectRatio,
          imageUrl,
          imageId: `fal-${Date.now()}`, // Generate a unique ID
          tokensUsed: tokensToDeduct
        }
      });
      
      console.log('Created image record:', {
        id: newImage.id,
        imageId: newImage.imageId,
        prompt: newImage.prompt,
        userId: newImage.userId
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

      return newImage;
    });
    
    return Response.json({ 
      imageUrl: image.imageUrl,
      imageId: image.imageId,
      prompt: image.prompt,
      aspectRatio: image.aspectRatio,
      createdAt: image.createdAt
    }, { status: 200 });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ 
      error: error?.message || "Failed to generate image" 
    }, { status: 500 });
  }
}

