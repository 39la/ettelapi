import { Frame, Label } from "./components";
import { DEFAULT_CANVAS, SANS } from "./shared";

export function renderErrorSvg(message: string): string {
  return String(
    <Frame canvas={DEFAULT_CANVAS} title="Invalid palette">
      <rect width={DEFAULT_CANVAS.w} height={DEFAULT_CANVAS.h} fill="#0B0B0C" />
      <rect x={56} y={56} width={6} height={6} rx={1} fill="#F94144" />
      <Label x={76} y={66} fs={13} fill="#ffffff" ls={3.5} weight={600} family={SANS}>
        {"ETTELAPI"}
      </Label>
      <Label x={56} y={342} fs={168} fill="#ffffff" weight={500} ls={-4}>
        {"400"}
      </Label>
      <Label x={60} y={412} fs={24} fill="#F94144" family={SANS}>
        {message.slice(0, 90)}
      </Label>
      <Label x={60} y={468} fs={15} fill="#ffffff" opacity={0.5} family={SANS}>
        {"Use 3 or 6 hex digits, separated by hyphens."}
      </Label>
      <Label x={60} y={DEFAULT_CANVAS.h - 48} fs={13} fill="#ffffff" opacity={0.35}>
        {"e.g. /f94144-f3722c-f8961e-f9c74f.svg"}
      </Label>
    </Frame>,
  );
}
