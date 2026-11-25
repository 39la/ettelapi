import { CANVAS_H, CANVAS_W } from "./layouts";

export const MIN_SIZE = 16;
export const MAX_SIZE = 4096;
/** Cap total pixels so a crafted ?w=&h= cannot ask for a gigapixel image. */
export const MAX_AREA = 4_000_000;

export interface Size {
  w: number;
  h: number;
}

export type SizeResult = { ok: true; size: Size } | { ok: false; message: string };

const parseNumber = (raw: string, fallback: number, name: string): number | string => {
  if (raw.trim() === "") return fallback;
  if (!/^\d+$/.test(raw.trim())) {
    return `"${name}" must be a whole number.`;
  }
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Number(raw)));
};

/** Reads `?w=` and `?h=`, clamps them, then shrinks both to stay under MAX_AREA. */
export function parseSize(wRaw?: string, hRaw?: string): SizeResult {
  const w = parseNumber(wRaw ?? "", CANVAS_W, "w");
  if (typeof w === "string") return { ok: false, message: w };
  const h = parseNumber(hRaw ?? "", CANVAS_H, "h");
  if (typeof h === "string") return { ok: false, message: h };

  let width = w;
  let height = h;
  if (width * height > MAX_AREA) {
    const scale = Math.sqrt(MAX_AREA / (width * height));
    width = Math.max(MIN_SIZE, Math.floor(width * scale));
    height = Math.max(MIN_SIZE, Math.floor(height * scale));
    while (width * height > MAX_AREA) {
      if (width >= height) width -= 1;
      else height -= 1;
    }
  }
  return { ok: true, size: { w: width, h: height } };
}
