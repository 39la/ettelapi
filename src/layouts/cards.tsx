import { inkFor, labelOf, slugOf } from "../colors";
import { Frame, Label } from "./components";
import { type Canvas, SANS, fit, round, scaleOf, titleFor, two, useRows } from "./shared";

export function cards(colors: string[], site: string, canvas: Canvas, accent?: string): string {
  const { w, h } = canvas;
  const ink = inkFor(colors, accent);
  const paper = ink("#F4F3EF");
  const n = colors.length;
  const u = scaleOf(canvas);
  const pad = 56 * u;
  const gap = 18 * u;
  const top = 112 * u;
  const capH = 48 * u;
  const url = `${site}/${slugOf(colors)}`;

  const header = (
    <>
      <rect
        x={round(pad)}
        y={round(72 * u)}
        width={round(6 * u)}
        height={round(6 * u)}
        rx={round(u)}
        fill={paper}
        opacity={0.8}
      />
      <Label
        x={pad + 16 * u}
        y={80 * u}
        fs={13 * u}
        fill={paper}
        ls={3.5 * u}
        weight={600}
        family={SANS}
      >
        {"ETTELAPI"}
      </Label>
      <Label x={w - pad} y={80 * u} fs={12 * u} fill={paper} ls={2 * u} opacity={0.45} anchor="end">
        {`${n} ${n === 1 ? "COLOR" : "COLORS"}`}
      </Label>
    </>
  );

  if (n === 1) {
    const c = colors[0]!;
    const cw = Math.min(560 * u, w - pad * 2);
    const ch = Math.min(h - top - pad - capH, cw * 0.74);
    const cx = (w - cw) / 2;
    const cy = top + Math.max(0, (h - top - pad - capH - ch) / 2);
    return String(
      <Frame canvas={canvas} title={titleFor(colors)} bg="#F4F3EF">
        {header}
        <rect
          x={round(cx)}
          y={round(cy)}
          width={round(cw)}
          height={round(ch)}
          rx={round(22 * u)}
          fill={c}
        />
        <Label x={cx + 40 * u} y={cy + ch - 40 * u} fs={38 * u} fill={ink(c)} weight={500}>
          {`#${labelOf(c).toLowerCase()}`}
        </Label>
        <Label
          x={w / 2}
          y={cy + ch + 34 * u}
          fs={13 * u}
          fill={paper}
          opacity={0.45}
          anchor="middle"
          ls={u}
        >
          {url}
        </Label>
      </Frame>,
    );
  }

  if (useRows(canvas)) {
    // Portrait: one full-width card per row, label drawn on the color.
    const avail = h - top - pad - 30 * u;
    const cardH = (avail - gap * (n - 1)) / n;
    return String(
      <Frame canvas={canvas} title={titleFor(colors)} bg="#F4F3EF">
        {header}
        {colors.map((c, i) => {
          const y = top + i * (cardH + gap);
          const fg = ink(c);
          const hex = labelOf(c);
          return (
            <>
              <rect
                x={round(pad)}
                y={round(y)}
                width={round(w - pad * 2)}
                height={round(cardH)}
                rx={round(16 * u)}
                fill={c}
              />
              <Label
                x={pad + 18 * u}
                y={y + 28 * u}
                fs={11 * u}
                fill={fg}
                ls={1.5 * u}
                opacity={0.5}
              >
                {two(i + 1)}
              </Label>
              <Label
                x={pad + 18 * u}
                y={y + cardH - 18 * u}
                fs={fit(hex, w - pad * 2 - 36 * u, 26 * u, 0.6)}
                fill={fg}
                ls={0.8 * u}
              >
                {hex}
              </Label>
            </>
          );
        })}
        <Label
          x={w - pad}
          y={h - 16 * u}
          fs={11 * u}
          fill={paper}
          opacity={0.35}
          anchor="end"
          ls={0.5 * u}
        >
          {url}
        </Label>
      </Frame>,
    );
  }

  const cardH = h - pad - top - capH;
  const cw = (w - pad * 2 - gap * (n - 1)) / n;
  return String(
    <Frame canvas={canvas} title={titleFor(colors)} bg="#F4F3EF">
      {header}
      {colors.map((c, i) => {
        const x = pad + i * (cw + gap);
        const fg = ink(c);
        const hex = labelOf(c);
        return (
          <>
            <rect
              x={round(x)}
              y={round(top)}
              width={round(cw)}
              height={round(cardH)}
              rx={round(16 * u)}
              fill={c}
            />
            <Label x={x + 14 * u} y={top + 26 * u} fs={11 * u} fill={fg} ls={1.5 * u} opacity={0.5}>
              {two(i + 1)}
            </Label>
            <Label
              x={x + cw / 2}
              y={top + cardH + 30 * u}
              fs={fit(hex, cw - 28 * u, 15 * u, 0.6)}
              fill={paper}
              opacity={0.6}
              anchor="middle"
              ls={0.8 * u}
            >
              {hex}
            </Label>
          </>
        );
      })}
      <Label
        x={w - pad}
        y={h - 16 * u}
        fs={11 * u}
        fill={paper}
        opacity={0.35}
        anchor="end"
        ls={0.5 * u}
      >
        {url}
      </Label>
    </Frame>,
  );
}
