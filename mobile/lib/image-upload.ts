import type { ImagePickerAsset } from "expo-image-picker";

import type { UploadAsset } from "@/lib/api";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const EXTENSIONS = new Set(["jpg", "jpeg", "jfif", "png", "gif", "webp"]);

export function toUploadAsset(asset: ImagePickerAsset): UploadAsset {
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
    throw new Error("Choose an image that is 5MB or smaller.");
  }

  const type = (asset.mimeType || "image/jpeg").toLowerCase();
  const name = asset.fileName || `product-${Date.now()}.${type.split("/")[1] || "jpg"}`;
  const extension = name.split(".").pop()?.toLowerCase();
  if (!MIME_TYPES.has(type) || !extension || !EXTENSIONS.has(extension)) {
    throw new Error("Choose a JPEG, PNG, GIF, or WebP image.");
  }

  return {
    uri: asset.uri,
    name,
    type,
    fileSize: asset.fileSize,
    file: asset.file,
  };
}
