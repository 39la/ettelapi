import { contrastColor, labelOf, slugOf } from "../colors";
import { CANVAS_H, CANVAS_W, SANS, doc, fit, round, text, titleFor } from "./shared";

export function cards(colors: string[], site: string): string {
  const n = colors.length;
  const pad = 56;
  const gap = 18;
  const top = 112;
  const capH = 48;
  const cardH = CANVAS_H - pad - top - capH;
  const bg = "#F4F3EF";
  const url = `${site}/${slugOf(colors)}`;

  let g = `<rect x="${pad}" y="72" width="6" height="6" rx="1" fill="#111" opacity="0.8"/>`;
  g += text({
    x: pad + 16,
    y: 80,
    s: "PALETTE",
    fs: 13,
    fill: "#111",
    ls: 3.5,
    weight: 600,
    family: SANS,
  });
  g += text({
    x: CANVAS_W - pad,
    y: 80,
    s: `${n} ${n === 1 ? "COLOR" : "COLORS"}`,
    fs: 12,
    fill: "#111",
    ls: 2,
    opacity: 0.45,
    anchor: "end",
  });

  if (n === 1) {
    const c = colors[0]!;
    const cw = Math.min(560, CANVAS_W - pad * 2);
    const cx = (CANVAS_W - cw) / 2;
    g += `<rect x="${cx}" y="${top}" width="${cw}" height="${cardH}" rx="22" fill="${c}"/>`;
    g += text({
      x: cx + 40,
      y: top + cardH - 40,
      s: "#" + labelOf(c).toLowerCase(),
      fs: 38,
      fill: contrastColor(c),
      weight: 500,
    });
    g += text({
      x: CANVAS_W / 2,
      y: top + cardH + 34,
      s: url,
      fs: 13,
      fill: "#111",
      opacity: 0.45,
      anchor: "middle",
      ls: 1,
    });
    return doc(titleFor(colors), g, bg);
  }

  const cw = (CANVAS_W - pad * 2 - gap * (n - 1)) / n;
  colors.forEach((c, i) => {
    const x = pad + i * (cw + gap);
    const fg = contrastColor(c);
    g += `<rect x="${round(x)}" y="${top}" width="${round(cw)}" height="${cardH}" rx="16" fill="${c}"/>`;
    g += text({
      x: x + 14,
      y: top + 26,
      s: String(i + 1).padStart(2, "0"),
      fs: 11,
      fill: fg,
      ls: 1.5,
      opacity: 0.5,
    });
    const fs = fit(labelOf(c), cw - 28, 15, 0.6);
    g += text({
      x: x + cw / 2,
      y: top + cardH + 30,
      s: labelOf(c),
      fs,
      fill: "#111",
      opacity: 0.6,
      anchor: "middle",
      ls: 0.8,
    });
  });

  g += text({
    x: CANVAS_W - pad,
    y: CANVAS_H - 16,
    s: url,
    fs: 11,
    fill: "#111",
    opacity: 0.35,
    anchor: "end",
    ls: 0.5,
  });

  return doc(titleFor(colors), g, bg);
}
