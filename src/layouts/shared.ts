export const CANVAS_W = 1200;
export const CANVAS_H = 630;

/** Requested image size. Layouts are hand-tuned at 1200 × 630 and scale from there. */
export interface Canvas {
  w: number;
  h: number;
}

export const DEFAULT_CANVAS: Canvas = { w: CANVAS_W, h: CANVAS_H };

/** 1 at the design size; type and padding grow/shrink with the frame. */
export const scaleOf = ({ w, h }: Canvas): number => Math.min(w / CANVAS_W, h / CANVAS_H);

/** Square and portrait frames switch to row layouts; thin columns read badly. */
export const useRows = ({ w, h }: Canvas): boolean => h > w * 0.85;

export const SANS =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
export const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

export const round = (n: number): number => Math.round(n * 10) / 10;

export const fit = (s: string, maxW: number, desired: number, ratio = 0.6, min = 9) =>
  Math.max(min, Math.min(desired, maxW / (s.length * ratio)));

/** Zero-padded index used in the corner of swatches. */
export const two = (n: number): string => String(n).padStart(2, "0");

export function titleFor(colors: string[]): string {
  return colors.length === 1
    ? `Color ${colors[0]!.toUpperCase()}`
    : `${colors.length}-color palette`;
}
