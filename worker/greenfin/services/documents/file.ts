const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  heic: "image/heic",
};
const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif", "application/octet-stream", ""]);
const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx"]);

export const GREENFIN_MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateGreenFinFile(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return "請選擇要上傳的 GreenFin 文件";
  if (file.size > GREENFIN_MAX_FILE_SIZE) return "檔案大小不可超過 10 MB";
  if (!acceptedContentType(file)) return "僅支援 PDF、PNG、JPG、JPEG 或 HEIC，不接受 WebP";
  if (file.name.length > 180) return "檔名不可超過 180 個字";
  return "";
}

function acceptedContentType(file: File) {
  const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const expected = MIME_BY_EXTENSION[extension];
  const supplied = file.type.toLowerCase();
  if (!expected) return null;
  if (extension === "heic") return HEIC_MIME_TYPES.has(supplied) ? expected : null;
  if (extension === "jpg" || extension === "jpeg") return supplied === "image/jpeg" || supplied === "image/jpg" ? expected : null;
  return supplied === expected ? expected : null;
}

function prefix(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

export async function inspectGreenFinFile(file: File) {
  const contentType = acceptedContentType(file);
  if (!contentType) throw new Error("檔案副檔名與媒體格式不一致");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid = contentType === "application/pdf"
    ? bytes.length >= 5 && prefix(bytes, 0, 5) === "%PDF-"
    : contentType === "image/jpeg"
      ? bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : contentType === "image/png"
        ? bytes.length >= 8 && bytes[0] === 0x89 && prefix(bytes, 1, 8) === "PNG\r\n\x1a\n"
        : bytes.length >= 12 && prefix(bytes, 4, 8) === "ftyp" && (() => {
          const boxLength = (bytes[0] * 16777216 + bytes[1] * 65536 + bytes[2] * 256 + bytes[3]) >>> 0;
          const limit = Math.min(bytes.length, boxLength >= 12 ? boxLength : 64, 128);
          for (let offset = 8; offset + 4 <= limit; offset += 4) if (HEIC_BRANDS.has(prefix(bytes, offset, offset + 4))) return true;
          return false;
        })();
  if (!valid) throw new Error("檔案內容與格式不符，已拒絕上傳");
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { bytes, sha256, contentType };
}

export function safeGreenFinFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "greenfin-document";
}
