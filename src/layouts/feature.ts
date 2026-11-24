import { contrastColor, labelOf, mix } from "../colors";
import { CANVAS_H, CANVAS_W, doc, fit, round, text, titleFor } from "./shared";

export function feature(colors: string[], site: string): string {
  const split = Math.round(CANVAS_W * 0.56);
  const base = colors[0]!;
  const rest = colors.slice(1);
  const showTints = rest.length === 0;
  const items = showTints
    ? [0.85, 0.65, 0.45, 0.25, 0.1].map((t) => mix(base, "#ffffff", t))
    : rest;

  let g = `<rect x="0" y="0" width="${split + 1}" height="${CANVAS_H}" fill="${base}"/>`;
  g += `<rect x="${split}" y="0" width="${CANVAS_W - split}" height="${CANVAS_H}" fill="#101012"/>`;

  const fg = contrastColor(base);
  g += text({ x: 56, y: 68, s: "FEATURED", fs: 12, fill: fg, ls: 3.5, opacity: 0.65 });
  const big = fit("#" + labelOf(base), split - 112, 92, 0.62);
  g += text({ x: 52, y: CANVAS_H - 64, s: "#" + labelOf(base), fs: big, fill: fg, weight: 500 });
  g += text({
    x: 56,
    y: CANVAS_H - 30,
    s: `${site}/${labelOf(base).toLowerCase()}`,
    fs: 12,
    fill: fg,
    opacity: 0.55,
  });

  const padX = split + 52;
  const padTop = 76;
  const padBottom = 56;
  const rowH = (CANVAS_H - padTop - padBottom) / items.length;
  g += text({
    x: padX,
    y: 56,
    s: showTints ? "TINTS" : "PALETTE",
    fs: 12,
    fill: "#ffffff",
    ls: 3.5,
    opacity: 0.4,
  });
  g += text({
    x: CANVAS_W - 52,
    y: 56,
    s: `${colors.length} ${colors.length === 1 ? "COLOR" : "COLORS"}`,
    fs: 12,
    fill: "#ffffff",
    ls: 2,
    opacity: 0.3,
    anchor: "end",
  });

  items.forEach((c, i) => {
    const cy = padTop + rowH * i + rowH / 2;
    const chip = Math.min(52, rowH - 18);
    g += `<rect x="${padX}" y="${round(cy - chip / 2)}" width="${round(chip)}" height="${round(chip)}" rx="10" fill="${c}"/>`;
    g += text({
      x: padX + chip + 20,
      y: cy + 5,
      s: "#" + labelOf(c).toLowerCase(),
      fs: 16,
      fill: "#ffffff",
      opacity: 0.9,
    });
    g += text({
      x: CANVAS_W - 52,
      y: cy + 5,
      s: showTints ? `T${String(i + 1).padStart(2, "0")}` : String(i + 2).padStart(2, "0"),
      fs: 12,
      fill: "#ffffff",
      opacity: 0.3,
      anchor: "end",
      ls: 1,
    });
  });

  return doc(titleFor(colors), g);
}
