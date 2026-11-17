// Pièces jointes des réponses écrites dans le site (côté navigateur)
//  - types acceptés par le bucket « messages » ;
//  - photos JPEG/PNG réduites avant l'envoi (1600 px, JPEG 80 %) ;
//  - 5 fichiers, 10 Mo par fichier et 15 Mo au total après réduction.
export const REPLY_FILES = {
  maxFiles: 5,
  maxFileBytes: 10 * 1024 * 1024,
  maxTotalBytes: 15 * 1024 * 1024,
  accept: ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt",
};

const BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  txt: "text/plain",
};
const ALLOWED = new Set(Object.values(BY_EXT));

/** Type réel du fichier (Android envoie parfois un type vide ou « image/jpg »). */
export function replyFileType(file: File): string | null {
  const declared = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (ALLOWED.has(declared)) return declared;
  return BY_EXT[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? null;
}

export function storageName(name: string) {
  const clean = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  return clean || "fichier";
}

/** Photo réduite (JPEG) ; tout autre fichier est renvoyé tel quel. */
export async function shrinkForReply(file: File, type: string): Promise<{ blob: Blob; type: string; name: string }> {
  const same = { blob: file as Blob, type, name: file.name };
  if ((type !== "image/jpeg" && type !== "image/png") || file.size < 400 * 1024) return same;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return same;
    ctx.fillStyle = "#ffffff"; // fond blanc pour les PNG transparents
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    if (!blob || blob.size >= file.size) return same;
    const name = type === "image/png" ? file.name.replace(/\.png$/i, "") + ".jpg" : file.name;
    return { blob, type: "image/jpeg", name };
  } catch {
    return same;
  }
}
