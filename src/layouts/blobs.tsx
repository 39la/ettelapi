import { inkFor, labelOf, slugOf } from "../colors";
import { Frame, Label } from "./components";
import { type Canvas, SANS, round, scaleOf, titleFor, two } from "./shared";

export function blobs(colors: string[], site: string, canvas: Canvas, accent?: string): string {
  const { w, h } = canvas;
  const ink = inkFor(colors, accent);
  const paper = ink("#FBFAF7");
  const n = colors.length;
  const u = scaleOf(canvas);
  const url = `${site}/${slugOf(colors)}`;
  const header = (
    <Label
      x={56 * u}
      y={68 * u}
      fs={13 * u}
      fill={paper}
      ls={3.5 * u}
      opacity={0.55}
      weight={600}
      family={SANS}
    >
      {"ETTELAPI"}
    </Label>
  );

  if (n === 1) {
    const c = colors[0]!;
    return String(
      <Frame canvas={canvas} title={titleFor(colors)} bg="#FBFAF7">
        {header}
        <circle cx={round(w / 2)} cy={round(h / 2 - 20 * u)} r={round(190 * u)} fill={c} />
        <Label x={w / 2} y={h / 2 - 8 * u} fs={40 * u} fill={ink(c)} anchor="middle" weight={500}>
          {`#${labelOf(c)}`}
        </Label>
        <Label
          x={w / 2}
          y={h / 2 + 30 * u}
          fs={12 * u}
          fill={ink(c)}
          anchor="middle"
          ls={3 * u}
          opacity={0.6}
        >
          {"1 COLOR"}
        </Label>
        <Label x={w - 56 * u} y={h - 32 * u} fs={11 * u} fill={paper} opacity={0.3} anchor="end">
          {url}
        </Label>
      </Frame>,
    );
  }

  const r = Math.min(h * 0.3, (260 * u) / Math.sqrt(n / 3), (w - 220 * u) / (n * 1.35));
  const spacing = Math.min(r * 1.5, (w - 220 * u - r * 2) / Math.max(1, n - 1));
  const span = r * 2 + spacing * (n - 1);
  const start = (w - span) / 2 + r;

  return String(
    <Frame canvas={canvas} title={titleFor(colors)} bg="#FBFAF7">
      {header}
      {colors.map((c, i) => {
        const cx = start + spacing * i;
        const cy = h * 0.47 + (i % 2 === 0 ? -14 : 14) * u;
        return (
          <>
            <circle
              cx={round(cx)}
              cy={round(cy)}
              r={round(r)}
              fill={c}
              style="mix-blend-mode:multiply"
            />
            <Label
              x={cx}
              y={cy + r + 46 * u}
              fs={13 * u}
              fill={paper}
              opacity={0.65}
              anchor="middle"
              ls={0.8 * u}
            >
              {labelOf(c)}
            </Label>
            <Label
              x={cx}
              y={cy + r + 66 * u}
              fs={10 * u}
              fill={paper}
              opacity={0.3}
              anchor="middle"
              ls={2 * u}
            >
              {two(i + 1)}
            </Label>
          </>
        );
      })}
      <Label x={56 * u} y={h - 32 * u} fs={11 * u} fill={paper} ls={2.5 * u} opacity={0.3}>
        {`${n} COLORS`}
      </Label>
      <Label x={w - 56 * u} y={h - 32 * u} fs={11 * u} fill={paper} opacity={0.3} anchor="end">
        {url}
      </Label>
    </Frame>,
  );
}
