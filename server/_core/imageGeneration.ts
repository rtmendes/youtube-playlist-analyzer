/**
 * Image generation via Gemini 2.5 Flash Image (native API).
 * Uploads result to Supabase Storage or S3 and returns a public URL.
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

async function fetchImageAsBase64(
  url: string
): Promise<{ mimeType: string; data: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch reference image: ${response.status}`);
  }
  const mimeType = response.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { mimeType, data: buffer.toString("base64") };
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const parts: GeminiPart[] = [{ text: options.prompt }];

  if (options.originalImages?.length) {
    for (const img of options.originalImages) {
      if (img.b64Json && img.mimeType) {
        parts.push({
          inline_data: { mime_type: img.mimeType, data: img.b64Json },
        });
      } else if (img.url) {
        const fetched = await fetchImageAsBase64(img.url);
        parts.push({ inline_data: { mime_type: fetched.mimeType, data: fetched.data } });
      }
    }
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${ENV.geminiApiKey}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inline_data?: { mime_type?: string; data?: string };
        }>;
      };
    }>;
  };

  const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inline_data?.data);
  const base64Data = imagePart?.inline_data?.data;
  const mimeType = imagePart?.inline_data?.mime_type ?? "image/png";

  if (!base64Data) {
    throw new Error("Gemini returned no image data");
  }

  const buffer = Buffer.from(base64Data, "base64");
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";
  const { url } = await storagePut(`generated/${Date.now()}.${ext}`, buffer, mimeType);
  return { url };
}
