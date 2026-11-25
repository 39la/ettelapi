import type { Child } from "hono/jsx";
import { type Canvas, MONO, round } from "./shared";

export interface FrameProps {
  canvas: Canvas;
  title: string;
  bg?: string;
  children: Child;
}

/** The SVG root. Owns the viewBox, title, aria label, and optional background. */
export const Frame = ({ canvas: { w, h }, title, bg, children }: FrameProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={w}
    height={h}
    viewBox={`0 0 ${w} ${h}`}
    role="img"
    aria-label={title}
  >
    <title>{title}</title>
    {bg ? <rect width={w} height={h} fill={bg} /> : null}
    {children}
  </svg>
);

export interface LabelProps {
  x: number;
  y: number;
  fs: number;
  fill: string;
  anchor?: "start" | "middle" | "end";
  family?: string;
  weight?: number;
  ls?: number;
  opacity?: number;
  children: Child;
}

/** `<text>` with the defaults the layouts share, plus rounding. */
export const Label = ({
  x,
  y,
  fs,
  fill,
  anchor,
  family = MONO,
  weight,
  ls = 0,
  opacity,
  children,
}: LabelProps) => (
  <text
    x={round(x)}
    y={round(y)}
    font-family={family}
    font-size={round(fs)}
    font-weight={weight}
    fill={fill}
    text-anchor={anchor}
    letter-spacing={ls ? round(ls) : undefined}
    opacity={opacity}
  >
    {children}
  </text>
);
