import { inkFor, labelOf, mix } from "../colors";
import { Frame, Label } from "./components";
import { type Canvas, fit, round, scaleOf, titleFor, two, useRows } from "./shared";

interface ChipRowProps {
  color: string;
  index: number;
  x: number;
  cy: number;
  chip: number;
  tagX: number;
  u: number;
  showTints: boolean;
  ink: string;
}

const ChipRow = ({ color, index, x, cy, chip, tagX, u, showTints, ink }: ChipRowProps) => (
  <>
    <rect
      x={round(x)}
      y={round(cy - chip / 2)}
      width={round(chip)}
      height={round(chip)}
      rx={round(10 * u)}
      fill={color}
    />
    <Label x={x + chip + 20 * u} y={cy + 5 * u} fs={16 * u} fill={ink} opacity={0.9}>
      {`#${labelOf(color).toLowerCase()}`}
    </Label>
    <Label x={tagX} y={cy + 5 * u} fs={12 * u} fill={ink} opacity={0.3} anchor="end" ls={u}>
      {showTints ? `T${two(index + 1)}` : two(index + 2)}
    </Label>
  </>
);

export function feature(colors: string[], site: string, canvas: Canvas, accent?: string): string {
  const { w, h } = canvas;
  const tint = inkFor(colors, accent);
  const u = scaleOf(canvas);
  const base = colors[0]!;
  const rest = colors.slice(1);
  const showTints = rest.length === 0;
  const items = showTints
    ? [0.85, 0.65, 0.45, 0.25, 0.1].map((t) => mix(base, "#ffffff", t))
    : rest;
  const fg = tint(base);
  const listInk = tint("#101012");
  const listLabel = showTints ? "TINTS" : "PALETTE";
  const count = `${colors.length} ${colors.length === 1 ? "COLOR" : "COLORS"}`;

  if (useRows(canvas)) {
    // Portrait: hero on top, list underneath.
    const heroH = Math.round(h * 0.56);
    const listTop = heroH + 48 * u;
    const rowH = (h - listTop - 40 * u) / items.length;
    return String(
      <Frame canvas={canvas} title={titleFor(colors)}>
        <rect width={w} height={heroH} fill={base} />
        <rect y={heroH} width={w} height={h - heroH} fill="#101012" />
        <Label x={56 * u} y={68 * u} fs={12 * u} fill={fg} ls={3.5 * u} opacity={0.65}>
          {"FEATURED"}
        </Label>
        <Label
          x={52 * u}
          y={heroH - 60 * u}
          fs={fit(`#${labelOf(base)}`, w - 112 * u, 92 * u, 0.62)}
          fill={fg}
          weight={500}
        >
          {`#${labelOf(base)}`}
        </Label>
        <Label x={56 * u} y={heroH - 28 * u} fs={12 * u} fill={fg} opacity={0.55}>
          {`${site}/${labelOf(base).toLowerCase()}`}
        </Label>
        <Label x={56 * u} y={heroH + 30 * u} fs={12 * u} fill={listInk} ls={3.5 * u} opacity={0.4}>
          {listLabel}
        </Label>
        <Label
          x={w - 56 * u}
          y={heroH + 30 * u}
          fs={12 * u}
          fill={listInk}
          ls={2 * u}
          opacity={0.3}
          anchor="end"
        >
          {count}
        </Label>
        {items.map((c, i) => {
          const cy = listTop + rowH * i + rowH / 2;
          return (
            <ChipRow
              color={c}
              index={i}
              x={56 * u}
              cy={cy}
              chip={Math.min(52 * u, rowH - 18 * u)}
              tagX={w - 56 * u}
              u={u}
              showTints={showTints}
              ink={listInk}
            />
          );
        })}
      </Frame>,
    );
  }

  const split = Math.round(w * 0.56);
  const padX = split + 52 * u;
  const padTop = 76 * u;
  const padBottom = 56 * u;
  const rowH = (h - padTop - padBottom) / items.length;
  return String(
    <Frame canvas={canvas} title={titleFor(colors)}>
      <rect width={split + 1} height={h} fill={base} />
      <rect x={split} width={w - split} height={h} fill="#101012" />
      <Label x={56 * u} y={68 * u} fs={12 * u} fill={fg} ls={3.5 * u} opacity={0.65}>
        {"FEATURED"}
      </Label>
      <Label
        x={52 * u}
        y={h - 64 * u}
        fs={fit(`#${labelOf(base)}`, split - 112 * u, 92 * u, 0.62)}
        fill={fg}
        weight={500}
      >
        {`#${labelOf(base)}`}
      </Label>
      <Label x={56 * u} y={h - 30 * u} fs={12 * u} fill={fg} opacity={0.55}>
        {`${site}/${labelOf(base).toLowerCase()}`}
      </Label>
      <Label x={padX} y={56 * u} fs={12 * u} fill={listInk} ls={3.5 * u} opacity={0.4}>
        {listLabel}
      </Label>
      <Label
        x={w - 52 * u}
        y={56 * u}
        fs={12 * u}
        fill={listInk}
        ls={2 * u}
        opacity={0.3}
        anchor="end"
      >
        {count}
      </Label>
      {items.map((c, i) => {
        const cy = padTop + rowH * i + rowH / 2;
        return (
          <ChipRow
            color={c}
            index={i}
            x={padX}
            cy={cy}
            chip={Math.min(52 * u, rowH - 18 * u)}
            tagX={w - 52 * u}
            u={u}
            showTints={showTints}
            ink={listInk}
          />
        );
      })}
    </Frame>,
  );
}
