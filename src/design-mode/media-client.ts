import { isAllowedMediaFile } from "@/lib/media-additions.types";

export type StagedUpload = { token: string; url: string; filename: string; mime: string; size: number };

/** Validates client-side (fast feedback) and uploads to the local staging endpoint. */
export async function uploadMediaFile(file: File): Promise<StagedUpload> {
  if (!isAllowedMediaFile(file.name, file.type)) {
    throw new Error("Only .png, .jpg, .jpeg, and .mp4 files are supported.");
  }
  const res = await fetch("/__design-mode/upload-media", {
    method: "POST",
    headers: {
      "x-filename": encodeURIComponent(file.name),
      "content-type": file.type,
    },
    body: file,
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as StagedUpload;
}

export function mediaTypeFor(file: File): "image" | "video" {
  return file.type === "video/mp4" ? "video" : "image";
}
