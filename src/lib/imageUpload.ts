import { supabase } from "@/integrations/supabase/client";

const BUCKET = "shop-item-images";
const MAX_DIM = 800;
const QUALITY = 0.85;

/** Resize an image source (File or data URL) to <=800x800 and return a webp Blob. */
export async function toWebpBlob(src: File | string): Promise<Blob> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  try {
    const img = await loadImage(url);
    const { width, height } = fit(img.naturalWidth, img.naturalHeight, MAX_DIM);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/webp", QUALITY));
    if (!blob) throw new Error("encode failed");
    return blob;
  } finally {
    if (typeof src !== "string") URL.revokeObjectURL(url);
  }
}

function fit(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const r = Math.min(max / w, max / h);
  return { width: Math.round(w * r), height: Math.round(h * r) };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("image load failed"));
    img.src = url;
  });
}

/** Upload a blob to the bucket and return the public URL. */
export async function uploadShopImage(itemId: string, blob: Blob): Promise<string> {
  const path = `${itemId}.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust so updates show immediately
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Convenience: take a File, produce 800px webp, upload, return URL. */
export async function processAndUpload(itemId: string, file: File | string): Promise<string> {
  const blob = await toWebpBlob(file);
  return uploadShopImage(itemId, blob);
}
