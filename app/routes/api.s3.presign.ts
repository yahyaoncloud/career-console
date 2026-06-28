import { type ActionFunctionArgs } from "react-router";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireUser } from "~/lib/auth.server";
import { jsonResponse, errorResponse } from "~/lib/api.server";

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

    // 2. Parse payload
    const body = await request.json();
    const { filename, contentType, bucket = "career-assets" } = body || {};

    if (!filename) {
      return errorResponse(new Error("Filename is required"), { status: 400, requestId });
    }

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
