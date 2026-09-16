const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const GREENFIN_MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateGreenFinFile(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return "請選擇要上傳的 GreenFin 文件";
  if (file.size > GREENFIN_MAX_FILE_SIZE) return "檔案大小不可超過 10 MB";
  if (!ALLOWED_TYPES.has(file.type)) return "僅支援 PDF、JPG、PNG、WebP 或 XLSX";
  if (file.name.length > 180) return "檔名不可超過 180 個字";
  return "";
}

function prefix(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

export async function inspectGreenFinFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid = file.type === "application/pdf"
    ? bytes.length >= 5 && prefix(bytes, 0, 5) === "%PDF-"
    : file.type === "image/jpeg"
      ? bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : file.type === "image/png"
        ? bytes.length >= 8 && bytes[0] === 0x89 && prefix(bytes, 1, 4) === "PNG"
        : file.type === "image/webp"
          ? bytes.length >= 12 && prefix(bytes, 0, 4) === "RIFF" && prefix(bytes, 8, 12) === "WEBP"
          : bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (!valid) throw new Error("檔案內容與格式不符，已拒絕上傳");
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { bytes, sha256 };
}

export function safeGreenFinFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "greenfin-document";
}
