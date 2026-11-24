import { blobs } from "./blobs";
import { cards } from "./cards";
import { feature } from "./feature";
import { mosaic } from "./mosaic";
import { scale } from "./scale";
import { strip } from "./strip";

export type Layout = "strip" | "cards" | "feature" | "mosaic" | "blobs" | "scale";

interface LayoutInfo {
  id: Layout;
  name: string;
  blurb: string;
  supports: (count: number) => boolean;
}

export const LAYOUTS: LayoutInfo[] = [
  {
    id: "strip",
    name: "Bands",
    blurb: "Full-bleed bands. Safe for any count.",
    supports: () => true,
  },
  {
    id: "cards",
    name: "Cards",
    blurb: "Floating swatches on paper.",
    supports: () => true,
  },
  {
    id: "feature",
    name: "Featured",
    blurb: "One hero color plus a side list.",
    supports: () => true,
  },
  {
    id: "mosaic",
    name: "Bento",
    blurb: "Gap grid. Best from four colors.",
    supports: () => true,
  },
  {
    id: "blobs",
    name: "Circles",
    blurb: "Overlapping circles.",
    supports: () => true,
  },
  {
    id: "scale",
    name: "Scale",
    blurb: "Tints and shades of one color.",
    supports: (count) => count === 1,
  },
];

export const DEFAULT_LAYOUT: Layout = "strip";

export const isLayout = (value: string): value is Layout => LAYOUTS.some((l) => l.id === value);

export const layoutInfo = (layout: Layout): LayoutInfo => LAYOUTS.find((l) => l.id === layout)!;

export { renderErrorSvg } from "./error";

interface RenderOptions {
  /** Hostname shown in the small watermark, e.g. `palette.example`. */
  site: string;
}

type LayoutRenderer = (colors: string[], site: string) => string;

const RENDERERS: Record<Layout, LayoutRenderer> = {
  strip,
  cards,
  feature,
  mosaic,
  blobs,
  scale,
};

export function renderSvg(colors: string[], layout: Layout, options: RenderOptions): string {
  if (colors.length === 0) throw new Error("no colors");
  if (layout === "scale" && colors.length !== 1) {
    throw new Error("layout=scale only works with one color");
  }
  return RENDERERS[layout](colors, options.site || "palette");
}
