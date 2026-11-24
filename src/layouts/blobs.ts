import { contrastColor, labelOf, slugOf } from "../colors";
import { CANVAS_H, CANVAS_W, SANS, doc, round, text, titleFor } from "./shared";

export function blobs(colors: string[], site: string): string {
  const n = colors.length;
  const bg = "#FBFAF7";
  const url = `${site}/${slugOf(colors)}`;
  let g = "";
  g += text({
    x: 56,
    y: 68,
    s: "PALETTE",
    fs: 13,
    fill: "#111",
    ls: 3.5,
    opacity: 0.55,
    weight: 600,
    family: SANS,
  });

  if (n === 1) {
    const c = colors[0]!;
    const r = 190;
    g += `<circle cx="${CANVAS_W / 2}" cy="${CANVAS_H / 2 - 20}" r="${r}" fill="${c}"/>`;
    g += text({
      x: CANVAS_W / 2,
      y: CANVAS_H / 2 - 8,
      s: "#" + labelOf(c),
      fs: 40,
      fill: contrastColor(c),
      anchor: "middle",
      weight: 500,
    });
    g += text({
      x: CANVAS_W / 2,
      y: CANVAS_H / 2 + 30,
      s: "1 COLOR",
      fs: 12,
      fill: contrastColor(c),
      anchor: "middle",
      ls: 3,
      opacity: 0.6,
    });
    g += text({
      x: CANVAS_W - 56,
      y: CANVAS_H - 32,
      s: url,
      fs: 11,
      fill: "#111",
      opacity: 0.3,
      anchor: "end",
    });
    return doc(titleFor(colors), g, bg);
  }

  const r = Math.min(CANVAS_H * 0.3, 260 / Math.sqrt(n / 3), (CANVAS_W - 220) / (n * 1.35));
  const spacing = Math.min(r * 1.5, (CANVAS_W - 220 - r * 2) / Math.max(1, n - 1));
  const span = r * 2 + spacing * (n - 1);
  const start = (CANVAS_W - span) / 2 + r;

  colors.forEach((c, i) => {
    const cx = start + spacing * i;
    const cy = CANVAS_H * 0.47 + (i % 2 === 0 ? -14 : 14);
    g += `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(r)}" fill="${c}" style="mix-blend-mode:multiply"/>`;
    g += text({
      x: cx,
      y: cy + r + 46,
      s: labelOf(c),
      fs: 13,
      fill: "#111",
      opacity: 0.65,
      anchor: "middle",
      ls: 0.8,
    });
    g += text({
      x: cx,
      y: cy + r + 66,
      s: String(i + 1).padStart(2, "0"),
      fs: 10,
      fill: "#111",
      opacity: 0.3,
      anchor: "middle",
      ls: 2,
    });
  });

  g += text({
    x: 56,
    y: CANVAS_H - 32,
    s: `${n} COLORS`,
    fs: 11,
    fill: "#111",
    ls: 2.5,
    opacity: 0.3,
  });
  g += text({
    x: CANVAS_W - 56,
    y: CANVAS_H - 32,
    s: url,
    fs: 11,
    fill: "#111",
    opacity: 0.3,
    anchor: "end",
  });

  return doc(titleFor(colors), g, bg);
}
