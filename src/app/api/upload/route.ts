import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const sanitizedFilename = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_{2,}/g, "_");
    const filename = `${uniqueId}_${sanitizedFilename}`;

    // 1. Try uploading to Supabase Storage (Production) if configured
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        const cookieStore = await cookies();
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookieInstances) {
              try {
                cookieInstances.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore headers
              }
            },
          },
        });

        // Ensure user is authenticated
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase.storage
            .from("uploads")
            .upload(filename, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (data && !error) {
            const { data: { publicUrl } } = supabase.storage
              .from("uploads")
              .getPublicUrl(filename);
            return NextResponse.json({ url: publicUrl });
          } else {
            console.warn("Supabase Storage upload failed (probably bucket 'uploads' is not created):", error);
          }
        }
      }
    } catch (supabaseError) {
      console.warn("Supabase Storage upload skipped:", supabaseError);
    }

    // 2. Local Fallback (Development/Localhost)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const localUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: localUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error occurred during upload" },
      { status: 500 }
    );
  }
}
