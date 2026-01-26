
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as Blob | null;
        const filename = formData.get("filename") as string | null;

        if (!file || !filename) {
            return NextResponse.json(
                { success: false, error: "File and filename are required" },
                { status: 400 }
            );
        }

        // Convert Blob to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        // Bucket: "Mil VN Images"
        // Filename should already be normalized clientside (e.g. 818.webp)
        // We upload to the root of the bucket as requested.

        const { data, error } = await supabaseAdmin.storage
            .from("Mil VN Images")
            .upload(`uploads/${filename}`, buffer, {
                contentType: "image/webp",
                upsert: true, // Replace if exists
                cacheControl: "3600"
            });

        if (error) {
            console.error("Supabase Admin Storage Error:", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Uploaded successfully",
            path: data.path
        });

    } catch (error: any) {
        console.error("Upload handler error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Unknown server error" },
            { status: 500 }
        );
    }
}
