import { slugOf } from "../colors";
import { CANVAS_H, CANVAS_W, DEFAULT_LAYOUT, type Layout } from "../layouts";
import type { Size } from "../size";

export const DEFAULT_SIZE: Size = { w: CANVAS_W, h: CANVAS_H };

export const SAMPLE = ["#f94144", "#f3722c", "#f8961e", "#f9c74f", "#90be6d", "#577590"];

export const EXAMPLES: { colors: string[]; label: string }[] = [
  { colors: SAMPLE, label: "Six colors" },
  { colors: ["#264653", "#2a9d8f", "#e9c46a", "#f4a261"], label: "Cool four" },
  {
    colors: ["#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff"],
    label: "Pastel",
  },
  { colors: ["#ff3b30"], label: "One color" },
];

export const palettePath = (
  colors: string[],
  layout: Layout,
  extension: "" | ".svg",
  size: Size = DEFAULT_SIZE,
  accent?: string,
): string => {
  const params: string[] = [];
  if (layout !== DEFAULT_LAYOUT) params.push(`layout=${layout}`);
  if (accent) params.push(`accent=${accent.slice(1)}`);
  if (size.w !== DEFAULT_SIZE.w) params.push(`w=${size.w}`);
  if (size.h !== DEFAULT_SIZE.h) params.push(`h=${size.h}`);
  const suffix = params.length > 0 ? `?${params.join("&")}` : "";
  return `/${slugOf(colors)}${extension}${suffix}`;
};
