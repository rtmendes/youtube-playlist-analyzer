import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseClient;
}

function getS3Client(): S3Client | null {
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function uploadViaSupabase(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      "Supabase storage not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  const { error } = await supabase.storage
    .from(ENV.storageBucket)
    .upload(key, body, { contentType, upsert: true });
  if (error) {
    throw new Error(`Supabase storage upload failed: ${error.message}`);
  }
  const { data: publicUrl } = supabase.storage.from(ENV.storageBucket).getPublicUrl(key);
  return publicUrl.publicUrl;
}

async function uploadViaS3(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  const client = getS3Client();
  if (!bucket || !client) {
    throw new Error(
      "S3 storage not configured: set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY"
    );
  }
  const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  const region = process.env.S3_REGION!;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const url = getSupabase()
    ? await uploadViaSupabase(key, data, contentType)
    : await uploadViaS3(key, data, contentType);
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const supabase = getSupabase();
  if (supabase) {
    const { data } = supabase.storage.from(ENV.storageBucket).getPublicUrl(key);
    return { key, url: data.publicUrl };
  }
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  if (!bucket || !region) {
    throw new Error("Storage not configured");
  }
  return { key, url: `https://${bucket}.s3.${region}.amazonaws.com/${key}` };
}
