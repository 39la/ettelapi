import { esc } from "../escape";

export const CANVAS_W = 1200;
export const CANVAS_H = 630;

export const SANS =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

interface TextOptions {
  x: number;
  y: number;
  s: string;
  fs: number;
  fill: string;
  anchor?: "start" | "middle" | "end";
  family?: string;
  weight?: number;
  ls?: number;
  opacity?: number;
  len?: number;
}

export const text = ({
  x,
  y,
  s,
  fs,
  fill,
  anchor = "start",
  family = MONO,
  weight = 400,
  ls = 0,
  opacity = 1,
  len,
}: TextOptions): string =>
  `<text x="${round(x)}" y="${round(y)}" font-family="${family}" font-size="${round(fs)}" font-weight="${weight}" ` +
  `fill="${fill}"${anchor !== "start" ? ` text-anchor="${anchor}"` : ""}` +
  `${ls ? ` letter-spacing="${round(ls)}"` : ""}` +
  `${opacity !== 1 ? ` opacity="${opacity}"` : ""}` +
  `${len ? ` textLength="${round(len)}" lengthAdjust="spacingAndGlyphs"` : ""}>${esc(s)}</text>`;

export const round = (n: number): number => Math.round(n * 10) / 10;

export const fit = (s: string, maxW: number, desired: number, ratio = 0.6, min = 9) =>
  Math.max(min, Math.min(desired, maxW / (s.length * ratio)));

export const doc = (title: string, body: string, bg?: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" role="img" aria-label="${esc(
    title,
  )}"><title>${esc(title)}</title>` +
  (bg ? `<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="${bg}"/>` : "") +
  body +
  `</svg>`;

export function titleFor(colors: string[]): string {
  return colors.length === 1
    ? `Color ${colors[0]!.toUpperCase()}`
    : `${colors.length}-color palette`;
}
