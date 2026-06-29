import { type ActionFunctionArgs } from "react-router";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireUser } from "~/lib/auth.server";
import { jsonResponse, errorResponse } from "~/lib/api.server";
import { checkRateLimit } from "~/lib/rate-limit.server";
import { BUCKETS } from "~/lib/supabase";
import { z } from "zod";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx"]);

const PresignSchema = z.object({
  filename: z.string().min(1).refine(name => {
    if (name.includes("..") || name.includes("/")) return false;
    const ext = name.split(".").pop()?.toLowerCase() || "";
    return ALLOWED_EXTENSIONS.has(ext);
  }, "Invalid file name or extension not allowed."),
  contentType: z.string().min(1),
  bucket: z.string().optional().default("career-assets").refine(b => BUCKETS.includes(b), "Invalid bucket"),
});

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
      region: "us-east-1",
      endpoint: "https://olxnluwjpkboskbjsmlj.supabase.co/storage/v1/s3",
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID || "",
        secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3Client;
}

export async function action({ request }: ActionFunctionArgs) {
  const requestId = crypto.randomUUID();
  
  if (request.method !== "POST") {
    return errorResponse(new Error("Method Not Allowed"), { status: 405, requestId });
  }

  try {
    // 1. Authenticate Request
    await requireUser(request);

    // 1.5 Rate Limiting (5 requests per IP to prevent spam)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await checkRateLimit(`presign_${ip}`, 5);
    if (!allowed) {
      return errorResponse(new Error("Rate limit exceeded"), { status: 429, requestId, message: "Too many requests. Please try again later." });
    }

    // 2. Parse payload
    const body = await request.json();
    const result = PresignSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(result.error, { status: 400, requestId });
    }

    const { filename, contentType, bucket } = result.data;

    // 3. Generate Presigned URL
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: String(filename),
      ContentType: contentType,
    });
    
    const presignedUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 300 });
    const publicUrl = `https://olxnluwjpkboskbjsmlj.supabase.co/storage/v1/object/public/${bucket}/${filename}`;
    
    // 4. Return standard JSON envelope
    return jsonResponse(
      { presignedUrl, publicUrl, path: filename },
      { message: "Presigned URL generated successfully", meta: { requestId } }
    );
  } catch (error) {
    console.error("[S3 Presign Error]:", error);
    return errorResponse(error, { requestId });
  }
}
