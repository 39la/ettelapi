import { contrastColor, labelOf, mix } from "../colors";
import { CANVAS_H, CANVAS_W, doc, fit, round, text, titleFor } from "./shared";

export function scale(colors: string[]): string {
  const base = colors[0]!;
  const top = 286;
  const steps: { c: string; tag: string }[] = [];
  for (let i = 0; i < 5; i++)
    steps.push({ c: mix(base, "#ffffff", 0.9 - i * 0.18), tag: `T${i + 1}` });
  steps.push({ c: base, tag: "BASE" });
  for (let i = 0; i < 5; i++)
    steps.push({ c: mix(base, "#000000", 0.12 + i * 0.16), tag: `S${i + 1}` });

  let g = `<rect x="0" y="0" width="${CANVAS_W}" height="${top}" fill="${base}"/>`;
  const fg = contrastColor(base);
  g += text({ x: 56, y: 66, s: "COLOR / SCALE", fs: 12, fill: fg, ls: 3.5, opacity: 0.65 });
  const big = fit("#" + labelOf(base), CANVAS_W - 112, 84, 0.62);
  g += text({ x: 52, y: top - 52, s: "#" + labelOf(base), fs: big, fill: fg, weight: 500 });
  g += text({
    x: CANVAS_W - 56,
    y: top - 56,
    s: "TINTS → SHADES",
    fs: 12,
    fill: fg,
    ls: 2.5,
    opacity: 0.6,
    anchor: "end",
  });

  const stepW = CANVAS_W / steps.length;
  steps.forEach(({ c, tag }, i) => {
    const x = i * stepW;
    const f = contrastColor(c);
    g += `<rect x="${round(x)}" y="${top}" width="${round(stepW + 0.6)}" height="${CANVAS_H - top}" fill="${c}"/>`;
    g += text({ x: x + 12, y: top + 26, s: tag, fs: 9, fill: f, ls: 1.2, opacity: 0.55 });
    g += text({ x: x + 12, y: CANVAS_H - 18, s: labelOf(c), fs: 11, fill: f, ls: 0.3 });
  });

  return doc(titleFor(colors), g);
}
