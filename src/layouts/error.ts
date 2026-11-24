import { CANVAS_H, CANVAS_W, SANS, doc, text } from "./shared";

export function renderErrorSvg(message: string): string {
  const g =
    `<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#0B0B0C"/>` +
    `<rect x="56" y="56" width="6" height="6" rx="1" fill="#F94144"/>` +
    text({
      x: 76,
      y: 66,
      s: "PALETTE",
      fs: 13,
      fill: "#ffffff",
      ls: 3.5,
      weight: 600,
      family: SANS,
    }) +
    text({ x: 56, y: 342, s: "400", fs: 168, fill: "#ffffff", weight: 500, ls: -4 }) +
    text({ x: 60, y: 412, s: message.slice(0, 90), fs: 24, fill: "#F94144", family: SANS }) +
    text({
      x: 60,
      y: 468,
      s: "Use 3 or 6 hex digits, separated by hyphens.",
      fs: 15,
      fill: "#ffffff",
      opacity: 0.5,
      family: SANS,
    }) +
    text({
      x: 60,
      y: CANVAS_H - 48,
      s: "e.g. /f94144-f3722c-f8961e-f9c74f.svg",
      fs: 13,
      fill: "#ffffff",
      opacity: 0.35,
    });
  return doc("Invalid palette", g);
}
