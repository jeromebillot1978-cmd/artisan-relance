// =====================================================================
// Règles des pièces jointes reçues des clients (stockées dans le dossier)
//  - types autorisés : PDF, photos (JPEG, PNG, WebP, HEIC), Word, Excel,
//    OpenDocument, texte ;
//  - 10 Mo par fichier, 5 fichiers et 15 Mo par message au maximum ;
//  - photos JPEG/PNG réduites (1600 px, JPEG qualité 75) ;
//  - WebP/HEIC (non convertibles ici) gardés jusqu'à 4 Mo ;
//  - logos de signature (images intégrées de moins de 100 Ko) ignorés.
// Tout fichier écarté est signalé dans une note visible par l'artisan.
// =====================================================================
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 5;
export const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
export const MAX_UNCONVERTED_IMAGE = 4 * 1024 * 1024;
const INLINE_IGNORE_BELOW = 100 * 1024;

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

export interface IncomingAttachment {
  id?: string;
  filename?: string | null;
  content_type?: string | null;
  size?: number | null;
  content_disposition?: string | null;
  download_url?: string | null;
}

export interface PlannedAttachment {
  index: number;
  filename: string;
  mime: string;
  size: number;
  url: string;
}

const mo = (n: number) => `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;

/** Type réel : l'extension prime sur un type générique (application/octet-stream). */
export function guessMime(filename: string, contentType?: string | null) {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  const declared = (contentType ?? "").toLowerCase().split(";")[0].trim();
  if (declared === "image/jpg" || declared === "image/pjpeg") return "image/jpeg";
  if (ALLOWED.has(declared)) return declared;
  return BY_EXT[ext] ?? declared;
}

/** Nom de fichier sûr pour le stockage (lettres, chiffres, - _ .). */
export function safeFileName(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._]+/, "")
    .slice(-80);
  return base || "fichier";
}

export function withExtension(name: string, ext: string) {
  const dot = name.lastIndexOf(".");
  return `${dot > 0 ? name.slice(0, dot) : name}.${ext}`;
}

/** Choisit les fichiers à garder et rédige la note des fichiers écartés. */
export function planAttachments(list: IncomingAttachment[]): { accepted: PlannedAttachment[]; notes: string[] } {
  const accepted: PlannedAttachment[] = [];
  const notes: string[] = [];
  let total = 0;
  list.forEach((a, index) => {
    const filename = (a.filename ?? "").trim() || `piece-jointe-${index + 1}`;
    const size = Number(a.size ?? 0);
    const mime = guessMime(filename, a.content_type);
    const inline = (a.content_disposition ?? "").toLowerCase().startsWith("inline");
    if (inline && mime.startsWith("image/") && size > 0 && size < INLINE_IGNORE_BELOW) return; // logo de signature
    if (!a.download_url) return void notes.push(`« ${filename} » n'a pas pu être récupéré.`);
    if (!ALLOWED.has(mime)) return void notes.push(`« ${filename} » écarté (type de fichier non accepté).`);
    if (size > MAX_FILE_BYTES) return void notes.push(`« ${filename} » écarté (${mo(size)}, maximum 10 Mo).`);
    if ((mime === "image/webp" || mime === "image/heic" || mime === "image/heif") && size > MAX_UNCONVERTED_IMAGE) {
      return void notes.push(`« ${filename} » écarté (photo ${mo(size)} dans un format non réductible, maximum 4 Mo).`);
    }
    if (accepted.length >= MAX_FILES) return void notes.push(`« ${filename} » écarté (5 pièces jointes maximum par message).`);
    if (total + size > MAX_TOTAL_BYTES) return void notes.push(`« ${filename} » écarté (15 Mo maximum par message).`);
    total += size;
    accepted.push({ index, filename, mime, size, url: a.download_url });
  });
  if (notes.length) notes.push("Demandez au client de vous les renvoyer autrement si besoin.");
  return { accepted, notes };
}
