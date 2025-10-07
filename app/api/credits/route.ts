import { NextRequest } from "next/server";
import { getKieCredits } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.VEO3_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "VEO3_API_KEY not configured" }, { status: 500 });
    }

    const credits = await getKieCredits(apiKey);
    
    return Response.json({ 
      credits,
      message: `You have ${credits} credits remaining`
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching credits:', error);
    return Response.json({ 
      error: error?.message || "Failed to fetch credits" 
    }, { status: 500 });
  }
}
