import { inkFor, labelOf } from "../colors";
import { Frame, Label } from "./components";
import { type Canvas, round, scaleOf, titleFor, two, useRows } from "./shared";

export function mosaic(colors: string[], _site: string, canvas: Canvas, accent?: string): string {
  const { w, h } = canvas;
  const ink = inkFor(colors, accent);
  const n = colors.length;
  const u = scaleOf(canvas);
  const tall = useRows(canvas);
  const gap = 10 * u;
  const pad = 20 * u;
  let cells: { x: number; y: number; w: number; h: number; i: number }[];

  if (n === 1) {
    cells = [{ x: pad, y: pad, w: w - pad * 2, h: h - pad * 2, i: 0 }];
  } else if (n === 5 && !tall) {
    const totalW = w - pad * 2;
    const totalH = h - pad * 2;
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
    const cols = tall ? (n <= 2 ? 1 : 2) : n <= 3 ? n : n <= 4 ? 2 : n <= 6 ? 3 : 4;
    const rows = Math.ceil(n / cols);
    const cw = (w - pad * 2 - gap * (cols - 1)) / cols;
    const ch = (h - pad * 2 - gap * (rows - 1)) / rows;
    cells = colors.map((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const lastOdd = tall && cols === 2 && i === n - 1 && n % 2 === 1;
      return {
        x: pad + col * (cw + gap),
        y: pad + row * (ch + gap),
        w: lastOdd ? w - pad * 2 : cw,
        h: ch,
        i,
      };
    });
  }

  return String(
    <Frame canvas={canvas} title={titleFor(colors)}>
      <rect width={w} height={h} fill="#0B0B0C" />
      {cells.map(({ x, y, w: cw, h: ch, i }) => {
        const c = colors[i]!;
        const fg = ink(c);
        return (
          <>
            <rect
              x={round(x)}
              y={round(y)}
              width={round(cw)}
              height={round(ch)}
              rx={round(14 * u)}
              fill={c}
            />
            <Label x={x + 18 * u} y={y + 28 * u} fs={11 * u} fill={fg} ls={1.5 * u} opacity={0.5}>
              {two(i + 1)}
            </Label>
            <Label x={x + 18 * u} y={y + ch - 18 * u} fs={15 * u} fill={fg} ls={0.5 * u}>
              {labelOf(c)}
            </Label>
          </>
        );
      })}
    </Frame>,
  );
}
