import { inkFor, labelOf, mix } from "../colors";
import { Frame, Label } from "./components";
import { type Canvas, fit, round, scaleOf, titleFor, useRows } from "./shared";

export function scale(colors: string[], _site: string, canvas: Canvas, accent?: string): string {
  const { w, h } = canvas;
  const ink = inkFor(colors, accent);
  const u = scaleOf(canvas);
  const base = colors[0]!;
  const tall = useRows(canvas) || w / h < 1.3;
  const steps: { c: string; tag: string }[] = [];
  for (let i = 0; i < 5; i++)
    steps.push({ c: mix(base, "#ffffff", 0.9 - i * 0.18), tag: `T${i + 1}` });
  steps.push({ c: base, tag: "BASE" });
  for (let i = 0; i < 5; i++)
    steps.push({ c: mix(base, "#000000", 0.12 + i * 0.16), tag: `S${i + 1}` });

  const fg = ink(base);
  const top = tall ? Math.round(h * 0.42) : Math.round(286 * u);
  const hero = (
    <>
      <rect width={w} height={top} fill={base} />
      <Label x={56 * u} y={66 * u} fs={12 * u} fill={fg} ls={3.5 * u} opacity={0.65}>
        {"COLOR / SCALE"}
      </Label>
      <Label
        x={52 * u}
        y={top - 52 * u}
        fs={fit(`#${labelOf(base)}`, w - 112 * u, 84 * u, 0.62)}
        fill={fg}
        weight={500}
      >
        {`#${labelOf(base)}`}
      </Label>
      <Label
        x={w - 56 * u}
        y={top - 56 * u}
        fs={12 * u}
        fill={fg}
        ls={2.5 * u}
        opacity={0.6}
        anchor="end"
      >
        {"TINTS → SHADES"}
      </Label>
    </>
  );

  if (tall) {
    const rowH = (h - top) / steps.length;
    return String(
      <Frame canvas={canvas} title={titleFor(colors)}>
        {hero}
        {steps.map(({ c, tag }, i) => {
          const y = top + i * rowH;
          const f = ink(c);
          return (
            <>
              <rect y={round(y)} width={w} height={round(rowH + 0.6)} fill={c} />
              <Label
                x={24 * u}
                y={y + rowH / 2 + 4 * u}
                fs={10 * u}
                fill={f}
                ls={1.2 * u}
                opacity={0.55}
              >
                {tag}
              </Label>
              <Label
                x={w - 24 * u}
                y={y + rowH / 2 + 5 * u}
                fs={13 * u}
                fill={f}
                ls={0.3 * u}
                anchor="end"
              >
                {labelOf(c)}
              </Label>
            </>
          );
        })}
      </Frame>,
    );
  }

  const stepW = w / steps.length;
  return String(
    <Frame canvas={canvas} title={titleFor(colors)}>
      {hero}
      {steps.map(({ c, tag }, i) => {
        const x = i * stepW;
        const f = ink(c);
        return (
          <>
            <rect
              x={round(x)}
              y={top}
              width={round(stepW + 0.6)}
              height={round(h - top)}
              fill={c}
            />
            <Label x={x + 12 * u} y={top + 26 * u} fs={9 * u} fill={f} ls={1.2 * u} opacity={0.55}>
              {tag}
            </Label>
            <Label x={x + 12 * u} y={h - 18 * u} fs={11 * u} fill={f} ls={0.3 * u}>
              {labelOf(c)}
            </Label>
          </>
        );
      })}
    </Frame>,
  );
}
