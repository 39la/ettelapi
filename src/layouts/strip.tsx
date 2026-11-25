import { inkFor, labelOf } from "../colors";
import { Frame, Label } from "./components";
import { type Canvas, fit, round, scaleOf, titleFor, two, useRows } from "./shared";

export function strip(colors: string[], site: string, canvas: Canvas, accent?: string): string {
  const { w, h } = canvas;
  const ink = inkFor(colors, accent);
  const n = colors.length;
  const u = scaleOf(canvas);

  const one = colors[0]!;
  if (n === 1) {
    const fg = ink(one);
    const hex = labelOf(one);
    return String(
      <Frame canvas={canvas} title={titleFor(colors)}>
        <rect width={w} height={h} fill={one} />
        <Label x={72 * u} y={96 * u} fs={13 * u} fill={fg} ls={3 * u} opacity={0.6}>
          {"ETTELAPI / 01"}
        </Label>
        <Label
          x={68 * u}
          y={h - 100 * u}
          fs={fit(`#${hex}`, w - 144 * u, 190 * u, 0.62)}
          fill={fg}
          weight={500}
        >
          {`#${hex}`}
        </Label>
        <Label x={72 * u} y={h - 48 * u} fs={13 * u} fill={fg} ls={3 * u} opacity={0.6}>
          {"1 COLOR"}
        </Label>
        <Label x={w - 72 * u} y={h - 48 * u} fs={13 * u} fill={fg} opacity={0.6} anchor="end">
          {`${site}/${hex}`}
        </Label>
      </Frame>,
    );
  }

  if (useRows(canvas)) {
    // Portrait: full-width rows read better than hairline columns.
    const rowH = h / n;
    return String(
      <Frame canvas={canvas} title={titleFor(colors)}>
        {colors.map((c, i) => {
          const y = i * rowH;
          const fg = ink(c);
          const hex = labelOf(c);
          return (
            <>
              <rect y={round(y)} width={w} height={round(rowH + 0.6)} fill={c} />
              <Label x={24 * u} y={y + 34 * u} fs={12 * u} fill={fg} ls={2 * u} opacity={0.55}>
                {two(i + 1)}
              </Label>
              <Label
                x={24 * u}
                y={y + rowH - 22 * u}
                fs={fit(hex, w - 48 * u, Math.min(30 * u, rowH * 0.24), 0.6)}
                fill={fg}
                ls={Math.max(0.5, 0.5 * u)}
              >
                {hex}
              </Label>
            </>
          );
        })}
      </Frame>,
    );
  }

  const bandW = w / n;
  return String(
    <Frame canvas={canvas} title={titleFor(colors)}>
      {colors.map((c, i) => {
        const x = i * bandW;
        const fg = ink(c);
        const hex = labelOf(c);
        const fs = fit(hex, bandW - 40 * u, Math.min(22 * u, bandW * 0.1), 0.6);
        return (
          <>
            <rect x={round(x)} width={round(bandW + 0.6)} height={h} fill={c} />
            <Label x={x + 20 * u} y={44 * u} fs={12 * u} fill={fg} ls={2 * u} opacity={0.55}>
              {two(i + 1)}
            </Label>
            <Label x={x + 20 * u} y={h - 26 * u} fs={fs} fill={fg} ls={Math.max(0.5, fs * 0.05)}>
              {hex}
            </Label>
          </>
        );
      })}
    </Frame>,
  );
}
