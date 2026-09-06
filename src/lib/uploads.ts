import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Uploaded files are saved to disk here but served through the
// /api/uploads/[filename] route rather than as a plain public/uploads/<file>
// URL — see that route's comment for why (Next's standalone server doesn't
// pick up files written to public/ after it has started).
function uploadUrl(filename: string): string {
  return `/api/uploads/${filename}`;
}

/** Saves an uploaded image File to disk and returns its servable URL. */
export async function saveUploadedImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED_TYPES.has(file.type)) return null;
  if (file.size > 8 * 1024 * 1024) return null; // 8MB cap per image

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return uploadUrl(filename);
}

// Favicons are a special case: browsers send inconsistent (or empty) MIME
// types for .ico uploads, so we trust the file's own extension rather than
// requiring a specific `file.type`, and cap size much lower — a favicon is
// never legitimately large.
const FAVICON_ALLOWED_EXT = new Set(["ico", "png", "svg"]);

/** Saves an uploaded favicon (.ico, .png, or .svg) to disk and returns its servable URL. */
export async function saveUploadedFavicon(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 2 * 1024 * 1024) return null; // 2MB cap — favicons are tiny

  const nameExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext = FAVICON_ALLOWED_EXT.has(nameExt)
    ? nameExt
    : file.type === "image/png"
      ? "png"
      : file.type === "image/svg+xml"
        ? "svg"
        : file.type.includes("icon")
          ? "ico"
          : null;
  if (!ext) return null;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return uploadUrl(filename);
}
