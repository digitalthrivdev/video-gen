import { NextRequest, NextResponse } from "next/server";
import { getAllActivePackages } from "@/lib/packages";

// Force dynamic rendering - no caching
// This ensures packages are always fetched fresh from database
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/packages
 * Fetches all active token packages from database
 * Public endpoint - no authentication required
 * ALWAYS DYNAMIC - Never cached for real-time pricing updates
 */
export async function GET(request: NextRequest) {
  try {
    const packages = await getAllActivePackages();
    
    return NextResponse.json({
      success: true,
      packages
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ 
      error: "Failed to fetch packages" 
    }, { status: 500 });
  }
}

