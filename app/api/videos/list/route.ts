import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVeo3VideoDetails } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get videos from database for the current user
    const videosFromDb = await prisma.video.findMany({
      where: { 
        userId: userId
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prompt: true,
        aspectRatio: true,
        imageUrl: true,
        videoUrl: true,
        videoId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tokensUsed: true,
        seed: true
      }
    });

    console.log(`Found ${videosFromDb.length} videos for user ${userId}:`, videosFromDb.map(v => ({
      id: v.id,
      taskId: v.videoId,
      prompt: v.prompt,
      status: v.status,
      createdAt: v.createdAt
    })));
    
    
    // Return empty array for now
    const videos: any[] = videosFromDb;

    // Refresh status from Kie API for generating videos
    const apiKey = process.env.VEO3_API_KEY;
    if (!apiKey) {
      console.error('VEO3_API_KEY not configured');
    }

    const mappedVideos = await Promise.all(
      videos.map(async (video) => {
        // For videos that are still generating, fetch current status from Kie API
        // Don't fetch video URLs here - they'll be fetched on-demand when user clicks
        if ((video.status === 'generating' || video.status === 'processing' || video.status === 'pending') && apiKey) {
          try {
            console.log(`Refreshing status for video ${video.videoId} from Kie API...`);
            const details = await getVeo3VideoDetails(video.videoId, apiKey, userId);
            
            if (details?.data) {
              // Update the video record in database with latest status
              await prisma.video.updateMany({
                where: { videoId: video.videoId },
                data: {
                  status: details.data.status === 'completed' ? 'completed' : 
                         details.data.status === 'processing' ? 'processing' : 
                         details.data.status === 'pending' ? 'pending' : 'failed',
                  videoUrl: details.data.videoUrl || video.videoUrl || '',
                  updatedAt: new Date()
                }
              });

              // Return updated video data (without video URL - fetch on demand)
              return {
                taskId: video.videoId,
                prompt: video.prompt,
                imageUrl: video.imageUrl,
                aspectRatio: video.aspectRatio,
                status: details.data.status,
                videoUrl: details.data.status === 'completed' ? details.data.videoUrl : null, // Only return URL for completed videos
                resolution: '720p',
                createTime: video.createdAt.toISOString(),
                completeTime: details.data.status === 'completed' ? new Date().toISOString() : null,
                tokensUsed: video.tokensUsed,
                fallbackFlag: false,
                errorCode: null,
                errorMessage: null
              };
            }
          } catch (error) {
            console.error(`Failed to refresh status for video ${video.videoId}:`, error);
          }
        }

        // Return original video data if no refresh needed or refresh failed
        return {
          taskId: video.videoId,
          prompt: video.prompt,
          imageUrl: video.imageUrl,
          aspectRatio: video.aspectRatio,
          status: video.status === 'completed' ? 'completed' : 
                  video.status === 'generating' ? 'generating' : 
                  video.status === 'processing' ? 'processing' :
                  video.status === 'pending' ? 'pending' : 'failed',
          videoUrl: video.status === 'completed' && video.videoUrl && !video.videoUrl.includes('placeholder.com') ? video.videoUrl : null, // Only return real video URLs
          resolution: '720p',
          createTime: video.createdAt.toISOString(),
          completeTime: video.status === 'completed' ? video.updatedAt.toISOString() : null,
          tokensUsed: video.tokensUsed,
          fallbackFlag: false,
          errorCode: null,
          errorMessage: null
        };
      })
    );
    
    return Response.json({ 
      videos: mappedVideos,
      count: mappedVideos.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching videos:', error);
    return Response.json({ 
      error: error?.message || "Failed to fetch videos" 
    }, { status: 500 });
  }
}
