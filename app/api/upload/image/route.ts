import { NextRequest } from "next/server";
import { uploadImageToUrl } from "@/lib/api/imagekit";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!fileName) {
      return Response.json({ error: "No fileName provided" }, { status: 400 });
    }

    // Upload to ImageKit
    const imageUrl = await uploadImageToUrl(file);
    
    return Response.json({ 
      url: imageUrl,
      fileName: file.name,
      size: file.size 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Image upload error:', error);
    return Response.json({ 
      error: error?.message || "Failed to upload image" 
    }, { status: 500 });
  }
}
