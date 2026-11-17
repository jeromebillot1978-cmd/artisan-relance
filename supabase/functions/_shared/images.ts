// =====================================================================
// Réduction des photos reçues des clients (pièces jointes des réponses).
// Codecs WebAssembly (mozjpeg, png) : le binaire est téléchargé une fois
// par instance depuis jsDelivr, version figée, et vérifié par empreinte
// SHA-256 avant usage. Une photo de 12 Mpx passe d'environ 3 Mo à ~150 Ko
// (~0,5 s de calcul). En cas d'échec, l'appelant garde le fichier d'origine
// s'il est petit, sinon il l'écarte : jamais d'erreur bloquante.
// =====================================================================
import jpegDecode, { init as initJpegDecode } from "npm:@jsquash/jpeg@1.6.0/decode.js";
import jpegEncode, { init as initJpegEncode } from "npm:@jsquash/jpeg@1.6.0/encode.js";
import pngDecode, { init as initPngDecode } from "npm:@jsquash/png@3.1.1/decode.js";

const CDN = "https://cdn.jsdelivr.net/npm";
const WASM = {
  jpegDec: {
    url: `${CDN}/@jsquash/jpeg@1.6.0/codec/dec/mozjpeg_dec.wasm`,
    sha256: "a7c4b12169817e779ff4af137981393ae924944e167ad1bd95747c9199162d3e",
  },
  jpegEnc: {
    url: `${CDN}/@jsquash/jpeg@1.6.0/codec/enc/mozjpeg_enc.wasm`,
    sha256: "24d4177f1c4963e2058b107189249651c61fdef125570e79b1dfb63c8bb49326",
  },
  png: {
    url: `${CDN}/@jsquash/png@3.1.1/codec/pkg/squoosh_png_bg.wasm`,
    sha256: "263d6e658808a74b72a1a99c5cc1d619237e70c150db6e41d5d84d3d117ab9be",
  },
} as const;

/** Source des binaires : jsDelivr par défaut, ou un lecteur fourni (tests hors ligne). */
export type WasmLoader = (name: keyof typeof WASM, url: string) => Promise<Uint8Array>;
let loader: WasmLoader = async (_name, url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`codec ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
};
export function setWasmLoader(fn: WasmLoader) {
  loader = fn;
}

async function compile(name: keyof typeof WASM) {
  const bytes = await loader(name, WASM[name].url);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (digest !== WASM[name].sha256) throw new Error(`codec ${name} : empreinte inattendue`);
  return await WebAssembly.compile(bytes as BufferSource);
}

let ready: Promise<void> | null = null;
function codecs() {
  ready ??= (async () => {
    const [dec, enc, png] = await Promise.all([compile("jpegDec"), compile("jpegEnc"), compile("png")]);
    await initJpegDecode(dec);
    await initJpegEncode(enc);
    await initPngDecode(png);
  })().catch((e) => {
    ready = null; // nouvel essai au prochain fichier
    throw e;
  });
  return ready;
}

/** Réduction rapide par moyenne de blocs n×n (n entier) : ~60 ms pour 12 Mpx. */
export function boxDownscale(img: { data: Uint8ClampedArray; width: number; height: number }, maxSide: number) {
  const n = Math.max(1, Math.ceil(Math.max(img.width, img.height) / maxSide));
  if (n === 1) return img;
  const w = Math.floor(img.width / n), h = Math.floor(img.height / n);
  const src = img.data, out = new Uint8ClampedArray(w * h * 4), k = n * n;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      for (let dy = 0; dy < n; dy++) {
        let i = ((y * n + dy) * img.width + x * n) * 4;
        for (let dx = 0; dx < n; dx++, i += 4) {
          r += src[i]; g += src[i + 1]; b += src[i + 2];
        }
      }
      const o = (y * w + x) * 4;
      out[o] = r / k; out[o + 1] = g / k; out[o + 2] = b / k; out[o + 3] = 255;
    }
  }
  return { data: out, width: w, height: h };
}

export const IMAGE_MAX_SIDE = 1600;
export const IMAGE_QUALITY = 75;
/** En dessous de ce poids, une photo JPEG est gardée telle quelle. */
export const IMAGE_KEEP_BELOW = 400 * 1024;

/**
 * JPEG ou PNG → JPEG réduit (côté max 1600 px, qualité 75).
 * Renvoie null si le format n'est pas pris en charge ou si le décodage échoue.
 */
export async function compressImage(bytes: Uint8Array<ArrayBuffer>, mime: string): Promise<Uint8Array<ArrayBuffer> | null> {
  const isJpeg = /^image\/(jpe?g|pjpeg)$/i.test(mime);
  const isPng = /^image\/png$/i.test(mime);
  if (!isJpeg && !isPng) return null;
  try {
    await codecs();
    const decoded = isJpeg
      ? await jpegDecode(bytes.buffer as ArrayBuffer, { preserveOrientation: true })
      : await pngDecode(bytes.buffer as ArrayBuffer);
    const small = boxDownscale(decoded as unknown as { data: Uint8ClampedArray; width: number; height: number }, IMAGE_MAX_SIDE);
    const out = await jpegEncode({ data: small.data, width: small.width, height: small.height, colorSpace: "srgb" } as ImageData, {
      quality: IMAGE_QUALITY,
    });
    const result = new Uint8Array(out);
    return result.byteLength < bytes.byteLength || isPng ? result : bytes;
  } catch {
    return null;
  }
}

/** Dimensions d'un JPEG ou d'un PNG lues dans l'en-tête, sans décoder l'image. */
export function imageSize(b: Uint8Array): { width: number; height: number } | null {
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return { width: v.getUint32(16), height: v.getUint32(20) };
  }
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) { i++; continue; }
    const len = (b[i + 2] << 8) | b[i + 3];
    // SOF0..SOF15 sauf DHT (C4), JPG (C8), DAC (CC)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
    }
    i += 2 + len;
  }
  return null;
}

/** Au-delà, le décodage risquerait de dépasser la mémoire ou le temps de calcul alloués. */
export const IMAGE_MAX_PIXELS = 25_000_000;
