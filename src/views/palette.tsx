import { contrastRatio, rgbOf, slugOf } from "../colors";
import { layoutInfo, LAYOUTS, type Layout } from "../layouts";
import { renderDocument } from "./document";
import { palettePath } from "./shared";

interface SnippetProps {
  name: string;
  code: string;
}

const Snippet = ({ name, code }: SnippetProps) => (
  <div class="code">
    <header>
      {name}
      <button data-copy={code}>copy</button>
    </header>
    <pre>{code}</pre>
  </div>
);

export interface PalettePageOptions {
  colors: string[];
  layout: Layout;
  origin: string;
  width: number;
  height: number;
  accent?: string;
}

export function renderPalettePage({
  colors,
  layout,
  origin,
  width,
  height,
  accent,
}: PalettePageOptions): string {
  const count = colors.length;
  const slug = slugOf(colors);
  const hexes = colors.map((c) => c.toUpperCase());
  const size = { w: width, h: height };
  const dims = `${width} × ${height}`;
  const pagePath = palettePath(colors, layout, "", size, accent);
  const svgPath = palettePath(colors, layout, ".svg", size, accent);
  const pageUrl = origin + pagePath;
  const svgUrl = origin + svgPath;
  const title = count === 1 ? `${hexes[0]} — ettelapi` : `${count}-color palette — ettelapi`;
  const description = hexes.join(" ");
  const layoutName = layoutInfo(layout).name;

  const switcher = LAYOUTS.map((item) => {
    if (!item.supports(count)) {
      return (
        <span class="disabled" title="Only for single colors">
          {item.name}
        </span>
      );
    }
    const current = item.id === layout;
    return (
      <a
        class={current ? "on" : undefined}
        href={palettePath(colors, item.id, "", size, accent) + "#image"}
        aria-current={current ? "page" : undefined}
      >
        {item.name}
      </a>
    );
  });

  const swatches = colors.map((color) => {
    const onWhite = contrastRatio(color, "#ffffff");
    const onBlack = contrastRatio(color, "#000000");
    const best =
      onBlack >= onWhite ? { name: "black", ratio: onBlack } : { name: "white", ratio: onWhite };
    return (
      <li class="swatch">
        <span class="chip" style={`--swatch: ${color}`} />
        <span class="hex">
          <b>{color}</b>
          <small>rgb({rgbOf(color).join(", ")})</small>
        </span>
        <span class="badge">
          {best.name} text {best.ratio.toFixed(1)}:1
        </span>
        <button class="ghost" data-copy={color}>
          copy
        </button>
      </li>
    );
  });

  const cssVars = `:root {\n${colors.map((c, i) => `  --palette-${i + 1}: ${c};`).join("\n")}\n}`;
  const tailwind = `@theme {\n${colors
    .map((c, i) => `  --color-palette-${i + 1}: ${c};`)
    .join("\n")}\n}`;
  const markdown = `![${count}-color palette](${svgUrl})`;
  const embed = `<img src="${svgUrl}" alt="${count}-color palette" width="${width}" height="${height}">`;

  return renderDocument({
    title,
    description,
    canonical: pageUrl,
    ogImage: svgUrl,
    ogImageWidth: width,
    ogImageHeight: height,
    children: (
      <>
        <div class="subbar">
          <a href="/">← New palette</a>
          <span class="sep">/</span>
          <span>{layoutName}</span>
        </div>

        <p class="kicker">
          <b>{count}-color palette</b>
          <span>·</span>
          <span>{dims}</span>
        </p>
        <h1>{hexes.join(" ")}</h1>

        <div class="urlbar">
          <code>{pagePath}</code>
          <button class="btn sec" data-copy={pageUrl}>
            Copy page URL
          </button>
        </div>

        <div class="hero" id="image">
          <img src={svgPath} alt={`${count}-color palette`} width={width} height={height} />
        </div>

        <div class="toolbar">
          <div class="seg" aria-label="Image layout">
            {switcher}
          </div>
          <span class="fmt">{dims}</span>
          <span class="spacer" />
          <a class="btn sec" href={svgPath} download={`${slug}.svg`}>
            Download SVG
          </a>
          <button class="btn" data-copy={svgUrl}>
            Copy image URL
          </button>
        </div>

        <div class="cols">
          <section class="panel">
            <h2>Colors</h2>
            <ul class="swatches">{swatches}</ul>
          </section>
          <aside class="panel">
            <h2>Details</h2>
            <div class="facts">
              <div>
                <span>Colors</span>
                <code>{count}</code>
              </div>
              <div>
                <span>Layout</span>
                <code>{layoutName}</code>
              </div>
              <div>
                <span>Size</span>
                <code>{dims}</code>
              </div>
              <div>
                <span>Format</span>
                <code>SVG</code>
              </div>
              {accent ? (
                <div>
                  <span>Accent</span>
                  <code>{accent}</code>
                </div>
              ) : null}
              <div>
                <span>License</span>
                <code>free to use</code>
              </div>
            </div>
            <h2>Routes</h2>
            <div class="facts">
              <div>
                <span>Image</span>
                <code>{svgPath}</code>
              </div>
              <div>
                <span>Page</span>
                <code>{pagePath}</code>
              </div>
            </div>
          </aside>
        </div>

        <section class="section">
          <h2>Use it</h2>
          <p class="sub">Everything is derived from the URL — no export step.</p>
          <div class="grid2">
            <Snippet name="CSS variables" code={cssVars} />
            <Snippet name="Tailwind v4" code={tailwind} />
            <Snippet name="Markdown" code={markdown} />
            <Snippet name="HTML" code={embed} />
          </div>
        </section>
      </>
    ),
  });
}
