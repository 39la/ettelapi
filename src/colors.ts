export const MAX_COLORS = 12;

export type ParseResult = { ok: true; colors: string[] } | { ok: false; message: string };

const HEX = /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i;

/**
 * Parses a palette path segment.
 * Accepts `ff3b30-2a9d8f`, `ff3b30,2a9d8f`, `#ff3b30`, 3-digit hex and mixed case.
 * Returns colours normalised to `#rrggbb` (lowercase).
 */
export function parseColors(input: string): ParseResult {
  const raw = input.trim();
  if (!raw) return { ok: false, message: "No colors given." };

  const tokens = raw.split(/[-,]/).map((t) => t.trim().replace(/^#/, ""));

  if (tokens.some((t) => t.length === 0)) {
    return { ok: false, message: "Empty color in the list." };
  }
  if (tokens.length > MAX_COLORS) {
    return { ok: false, message: `Too many colors (max ${MAX_COLORS}).` };
  }

  const colors: string[] = [];
  for (const token of tokens) {
    if (!HEX.test(token)) {
      return {
        ok: false,
        message: `"${token}" is not a hex color. Use 3 or 6 hex digits.`,
      };
    }
    colors.push(normalizeHex(token));
  }
  return { ok: true, colors };
}

export function normalizeHex(input: string): string {
  const hex = input.replace(/^#/, "").toLowerCase();
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  return "#" + full;
}

export function slugOf(colors: string[]): string {
  return colors
    .map(labelOf)
    .map((h) => h.toLowerCase())
    .join("-");
}

/** Uppercase hex without the `#`, as shown in the images. */
export function labelOf(hex: string): string {
  return hex.slice(1).toUpperCase();
}

export function rgbOf(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function hexOf(rgb: readonly number[]): string {
  return (
    "#" +
    rgb
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v ?? 0)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export function mix(a: string, b: string, t: number): string {
  const A = rgbOf(a);
  const B = rgbOf(b);
  return hexOf(A.map((v, i) => v + ((B[i] ?? 0) - v) * t));
}

export function relLuminance(hex: string): number {
  const [r, g, b] = rgbOf(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Picks black or white for text drawn on top of `hex`. */
export function contrastColor(hex: string): "#111111" | "#ffffff" {
  const L = relLuminance(hex);
  const vsWhite = 1.05 / (L + 0.05);
  const vsBlack = (L + 0.05) / 0.05;
  return vsBlack >= vsWhite ? "#111111" : "#ffffff";
}

/** The colour itself, lifted just enough to stay visible on black. */
export function inkColor(hex: string): string {
  return relLuminance(hex) > 0.06 ? hex : mix(hex, "#ffffff", 0.35);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export function randomPalette(count = 5): string[] {
  const base = Math.random() * 360;
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    const hue = (base + step * i + (Math.random() - 0.5) * 18 + 360) % 360;
    const sat = 58 + Math.random() * 28;
    const light = 46 + Math.random() * 18;
    return hslToHex(hue, sat, light);
  });
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return hexOf([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}
