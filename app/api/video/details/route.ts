import { NextRequest } from "next/server";
import { getVeo3VideoDetails } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return Response.json({ error: "taskId is required" }, { status: 400 });
  }

  const apiKey = process.env.VEO3_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "VEO3_API_KEY not configured" }, { status: 500 });
  }

  try {
    console.log('Fetching video details for taskId:', taskId);
    const details = await getVeo3VideoDetails(taskId, apiKey);
    console.log('Video details response:', details);
    
    // Update video record in database
    if (details?.data) {
      await prisma.video.updateMany({
        where: { videoId: taskId },
        data: {
          status: details.data.status === 'completed' ? 'completed' : 
                 details.data.status === 'processing' ? 'processing' : 
                 details.data.status === 'pending' ? 'pending' : 'failed',
          videoUrl: details.data.videoUrl || '',
          updatedAt: new Date()
        }
      });
    }
    
    return Response.json(details, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching video details:', error);
    return Response.json({ error: error?.message || "Failed to fetch details" }, { status: 500 });
  }
}


