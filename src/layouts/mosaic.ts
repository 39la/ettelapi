import { contrastColor, labelOf } from "../colors";
import { CANVAS_H, CANVAS_W, doc, round, text, titleFor } from "./shared";

export function mosaic(colors: string[]): string {
  const n = colors.length;
  const gap = 10;
  const pad = 20;
  let cells: { x: number; y: number; w: number; h: number; i: number }[];

  if (n === 1) {
    cells = [{ x: pad, y: pad, w: CANVAS_W - pad * 2, h: CANVAS_H - pad * 2, i: 0 }];
  } else if (n === 5) {
    const totalW = CANVAS_W - pad * 2;
    const totalH = CANVAS_H - pad * 2;
    const leftW = (totalW - gap) * 0.5;
    const rightW = totalW - gap - leftW;
    const cellH = (totalH - gap) / 2;
    const rightW2 = (rightW - gap) / 2;
    cells = [{ x: pad, y: pad, w: leftW, h: totalH, i: 0 }];
    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      cells.push({
        x: pad + leftW + gap + col * (rightW2 + gap),
        y: pad + row * (cellH + gap),
        w: rightW2,
        h: cellH,
        i: i + 1,
      });
    }
  } else {
    const cols = n <= 3 ? n : n <= 4 ? 2 : n <= 6 ? 3 : 4;
    const rows = Math.ceil(n / cols);
    const cw = (CANVAS_W - pad * 2 - gap * (cols - 1)) / cols;
    const ch = (CANVAS_H - pad * 2 - gap * (rows - 1)) / rows;
    cells = colors.map((_, i) => ({
      x: pad + (i % cols) * (cw + gap),
      y: pad + Math.floor(i / cols) * (ch + gap),
      w: cw,
      h: ch,
      i,
    }));
  }

  let g = `<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#0B0B0C"/>`;
  cells.forEach(({ x, y, w, h, i }) => {
    const c = colors[i]!;
    const fg = contrastColor(c);
    g += `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" rx="14" fill="${c}"/>`;
    g += text({
      x: x + 18,
      y: y + 28,
      s: String(i + 1).padStart(2, "0"),
      fs: 11,
      fill: fg,
      ls: 1.5,
      opacity: 0.5,
    });
    g += text({ x: x + 18, y: y + h - 18, s: labelOf(c), fs: 15, fill: fg, ls: 0.5 });
  });

  return doc(titleFor(colors), g);
}
