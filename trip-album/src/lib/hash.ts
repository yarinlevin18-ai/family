/**
 * Perceptual hashing for spotting near-identical photos (burst shots, the same
 * moment taken twice). Nothing here touches the stored file: hashing decodes a
 * tiny 9x8 copy in memory, the original bytes are never modified or re-encoded.
 */

const W = 9;
const H = 8;

/** 64-bit dHash as 16 hex chars, or null if the image could not be decoded. */
export async function perceptualHash(source: Blob): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(source, {
      resizeWidth: W,
      resizeHeight: H,
      resizeQuality: "low",
    });

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, W, H);
    bitmap.close();

    const { data } = ctx.getImageData(0, 0, W, H);
    const grey = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const o = i * 4;
      grey[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    }

    // Each row contributes 8 bits: is this pixel brighter than the next one?
    let bits = "";
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W - 1; x++) {
        bits += grey[y * W + x] > grey[y * W + x + 1] ? "1" : "0";
      }
    }

    let hex = "";
    for (let i = 0; i < 64; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex;
  } catch {
    return null;
  }
}

export async function perceptualHashFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!res.ok) return null;
    return await perceptualHash(await res.blob());
  } catch {
    return null;
  }
}

const POPCOUNT = Array.from({ length: 16 }, (_, i) => i.toString(2).split("1").length - 1);

/** Number of differing bits between two hashes; 64 when they are unusable. */
export function hamming(a: string, b: string): number {
  if (a.length !== 16 || b.length !== 16) return 64;
  let d = 0;
  for (let i = 0; i < 16; i++) {
    d += POPCOUNT[(parseInt(a[i], 16) ^ parseInt(b[i], 16)) & 15];
  }
  return d;
}
