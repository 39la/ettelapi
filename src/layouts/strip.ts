import { contrastColor, labelOf } from "../colors";
import { CANVAS_H, CANVAS_W, doc, fit, round, text, titleFor } from "./shared";

export function strip(colors: string[], site: string): string {
  const n = colors.length;
  const bandW = CANVAS_W / n;
  let g = "";

  colors.forEach((c, i) => {
    const x = i * bandW;
    const fg = contrastColor(c);
    const hex = labelOf(c);
    g += `<rect x="${round(x)}" y="0" width="${round(bandW + 0.6)}" height="${CANVAS_H}" fill="${c}"/>`;

    if (n === 1) {
      g += text({ x: 72, y: 96, s: "PALETTE / 01", fs: 13, fill: fg, ls: 3, opacity: 0.6 });
      const big = fit("#" + hex, CANVAS_W - 144, 190, 0.62);
      g += text({ x: 68, y: CANVAS_H - 100, s: "#" + hex, fs: big, fill: fg, weight: 500 });
      g += text({ x: 72, y: CANVAS_H - 48, s: "1 COLOR", fs: 13, fill: fg, ls: 3, opacity: 0.6 });
      g += text({
        x: CANVAS_W - 72,
        y: CANVAS_H - 48,
        s: `${site}/${hex}`,
        fs: 13,
        fill: fg,
        opacity: 0.6,
        anchor: "end",
      });
    } else {
      g += text({
        x: x + 20,
        y: 44,
        s: String(i + 1).padStart(2, "0"),
        fs: 12,
        fill: fg,
        ls: 2,
        opacity: 0.55,
      });
      const fs = fit(hex, bandW - 40, Math.min(22, bandW * 0.1), 0.6);
      g += text({
        x: x + 20,
        y: CANVAS_H - 26,
        s: hex,
        fs,
        fill: fg,
        ls: Math.max(0.5, fs * 0.05),
      });
    }
  });

  return doc(titleFor(colors), g);
}
