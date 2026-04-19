import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// R2 Client setup
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "storyboardbucket";

/**
 * Upload a file directly to R2 and return the key
 * 
 * @param file - File object to upload
 * @param key - R2 key (path) for the file
 * @returns Promise<string> - The R2 key of the uploaded file
 */
export async function uploadToR2(file: File | Blob, key: string): Promise<string> {
  try {
    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Create upload command
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: uint8Array,
      ContentType: file instanceof File ? file.type : 'application/octet-stream',
    });

    // Upload to R2
    const result = await r2.send(command);
    
    return key;
  } catch (error) {
    console.error('[R2 Upload] Error:', error);
    throw new Error(`R2 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the public URL for an R2 key
 * 
 * @param key - R2 key
 * @returns string - Public URL
 */
export function getR2PublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error('R2_PUBLIC_URL environment variable not set');
  }
  return `${publicUrl}/${key}`;
}
