import { MAX_COLORS } from "./colors";
import { DEFAULT_LAYOUT, LAYOUTS } from "./layouts";
import { MAX_AREA, MAX_SIZE, MIN_SIZE } from "./size";
import { EXAMPLES, SAMPLE } from "./views/shared";

/** A plain-text brief for LLM crawlers; kept in sync with README.md. */
export function renderLlmsTxt(origin: string): string {
  const sample = SAMPLE.map((c) => c.slice(1)).join("-");
  const layouts = LAYOUTS.map((l) => `- \`${l.id}\` — ${l.blurb}`).join("\n");
  const examples = EXAMPLES.map(
    ({ colors, label }) => `- ${label}: ${origin}/${colors.map((c) => c.slice(1)).join("-")}`,
  ).join("\n");

  return `# ettelapi

> Color palettes as images. Put 1–${MAX_COLORS} hex colors in the URL path and get an SVG image (default 1200×630, resizable) or an HTML page with swatches, RGB values, contrast ratios, and copy-paste snippets.

The image is a pure function of the URL, so it is served with \`Cache-Control: immutable\`.

## Routes

- GET ${origin}/{colors}.svg — SVG image, ${MIN_SIZE}–${MAX_SIZE}px per side
- GET ${origin}/{colors} — HTML page for the same palette
- GET ${origin}/random — 302 to a random palette page
- GET ${origin}/random.svg — 302 to a random palette image
- GET ${origin}/healthz — \`ok\`
- GET ${origin}/llms.txt — this file

## URL format

- \`{colors}\`: 1–${MAX_COLORS} hex colors, 3 or 6 digits, joined with hyphens. Case-insensitive; \`#\` is optional.
- Commas and a leading \`%23\` are accepted and 301-redirected to the hyphen form.
- Append \`.svg\` for the image. No extension returns HTML.
- Query parameters: \`layout\` (default \`${DEFAULT_LAYOUT}\`), \`w\` and \`h\` (default 1200×630, clamped to ${MIN_SIZE}–${MAX_SIZE}, max ${(MAX_AREA / 1_000_000).toFixed(0)} megapixels).

Example: ${origin}/${sample}.svg?layout=cards&w=1080&h=1080
Single-color example: ${origin}/ff3b30.svg?accent=1d4ed8

## Layouts

${layouts}

\`scale\` only works with exactly one color.

## Examples

${examples}

## Notes

- SVG is generated on the fly; PNG is not available yet.
- Invalid colors or layouts return HTTP 400 with an SVG error card for image URLs and an HTML error page otherwise.
- Layouts are hand-tuned at 1200×630 and adapt to other aspect ratios; tall frames switch to row layouts.
`;
}
