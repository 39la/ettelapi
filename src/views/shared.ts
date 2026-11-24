import { slugOf } from "../colors";
import { DEFAULT_LAYOUT, type Layout } from "../layouts";

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

export const palettePath = (colors: string[], layout: Layout, extension: "" | ".svg"): string => {
  const suffix = layout === DEFAULT_LAYOUT ? "" : `?layout=${layout}`;
  return `/${slugOf(colors)}${extension}${suffix}`;
};
