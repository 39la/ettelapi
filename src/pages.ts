import { contrastRatio, labelOf, rgbOf, slugOf } from "./colors";
import { esc } from "./escape";
import { DEFAULT_LAYOUT, layoutInfo, LAYOUTS, type Layout } from "./layouts";
import CSS from "./styles.css";

const SAMPLE = ["#f94144", "#f3722c", "#f8961e", "#f9c74f", "#90be6d", "#577590"];

const EXAMPLES: { colors: string[]; label: string }[] = [
  { colors: SAMPLE, label: "Six colors" },
  { colors: ["#264653", "#2a9d8f", "#e9c46a", "#f4a261"], label: "Cool four" },
  {
    colors: ["#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff"],
    label: "Pastel",
  },
  { colors: ["#ff3b30"], label: "One color" },
];

/* ------------------------------------------------------------------ shell -- */

interface ShellOptions {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  body: string;
}

const shell = ({
  title,
  description,
  canonical,
  ogImage,
  body,
}: ShellOptions): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="color-scheme" content="light">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">` : ""}
<meta name="twitter:card" content="summary_large_image">
<style>${CSS}</style>
</head>
<body>
<header class="nav wrap">
  <a class="brand" href="/"><i></i>palette</a>
  <nav><a href="/#layouts">Layouts</a><a href="/#url">URL</a><a href="/#examples">Examples</a></nav>
  <a class="btn push" href="/random">Random palette</a>
</header>
<main class="wrap">
${body}
<footer class="site">
  <span>SVG rendered on the fly. No accounts, no tracking.</span>
  <span>Free to use — a link back is appreciated.</span>
</footer>
</main>
<div class="toast" id="toast">Copied</div>
<script>
(() => {
  const toast = document.getElementById("toast");
  let timer;
  const show = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("show"), 1100);
  };
  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", async () => {
      const value = el.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(value);
        show("Copied " + (value.length > 40 ? "URL" : value));
      } catch {
        show("Copy failed");
      }
    });
  });
})();
</script>
</body>
</html>`;

/* ---------------------------------------------------------------- palette -- */

const route = (colors: string[], layout: Layout, extension: "" | ".svg"): string => {
  const suffix = layout === DEFAULT_LAYOUT ? "" : `?layout=${layout}`;
  return `/${slugOf(colors)}${extension}${suffix}`;
};

const snippetCard = (name: string, code: string): string =>
  `<div class="code">
  <header>${esc(name)}<button data-copy="${esc(code)}">copy</button></header>
  <pre>${esc(code)}</pre>
</div>`;

interface PalettePageOptions {
  colors: string[];
  layout: Layout;
  origin: string;
}

export function renderPalettePage({ colors, layout, origin }: PalettePageOptions): string {
  const n = colors.length;
  const slug = slugOf(colors);
  const hexes = colors.map((c) => c.toUpperCase());
  const pagePath = route(colors, layout, "");
  const svgPath = route(colors, layout, ".svg");
  const pageUrl = origin + pagePath;
  const svgUrl = origin + svgPath;
  const title = n === 1 ? `${hexes[0]} — palette` : `${n}-color palette — palette`;
  const description = hexes.join(" ");

  const switcher = LAYOUTS.map((l) => {
    if (!l.supports(n)) {
      return `<span class="disabled" title="Only for single colors">${esc(l.name)}</span>`;
    }
    const on = l.id === layout ? " on" : "";
    const href = route(colors, l.id, "") + "#image";
    return `<a class="${on.trim()}" href="${esc(href)}"${
      l.id === layout ? ' aria-current="page"' : ""
    }>${esc(l.name)}</a>`;
  }).join("");

  const swatches = colors
    .map((c) => {
      const onWhite = contrastRatio(c, "#ffffff");
      const onBlack = contrastRatio(c, "#000000");
      const best =
        onBlack >= onWhite ? { name: "black", ratio: onBlack } : { name: "white", ratio: onWhite };
      return `<li class="swatch">
  <span class="chip" style="background:${c}"></span>
  <span class="hex"><b>${esc(c.toLowerCase())}</b><small>rgb(${rgbOf(c).join(", ")})</small></span>
  <span class="badge">${best.name} text ${best.ratio.toFixed(1)}:1</span>
  <button class="ghost" data-copy="${esc(c.toLowerCase())}">copy</button>
</li>`;
    })
    .join("\n");

  const cssVars = `:root {\n${colors.map((c, i) => `  --palette-${i + 1}: ${c};`).join("\n")}\n}`;
  const tailwind = `@theme {\n${colors
    .map((c, i) => `  --color-palette-${i + 1}: ${c};`)
    .join("\n")}\n}`;
  const markdown = `![${n}-color palette](${svgUrl})`;
  const embed = `<img src="${svgUrl}" alt="${n}-color palette" width="1200" height="630">`;

  const body = `<div class="subbar"><a href="/">← New palette</a><span class="sep">/</span><span>${esc(
    layoutInfo(layout).name,
  )}</span></div>

<p class="kicker"><b>${n}-color palette</b><span>·</span><span>1200 × 630</span></p>
<h1>${hexes.map(esc).join(" ")}</h1>

<div class="urlbar">
  <code>${esc(pagePath)}</code>
  <button class="btn sec" data-copy="${esc(pageUrl)}">Copy page URL</button>
</div>

<div class="hero" id="image">
  <img src="${esc(svgPath)}" alt="${n}-color palette" width="1200" height="630">
</div>

<div class="toolbar">
  <div class="seg" aria-label="Image layout">${switcher}</div>
  <span class="fmt">1200 × 630</span>
  <span class="spacer"></span>
  <a class="btn sec" href="${esc(svgPath)}" download="${esc(slug)}.svg">Download SVG</a>
  <button class="btn" data-copy="${esc(svgUrl)}">Copy image URL</button>
</div>

<div class="cols">
  <section class="panel">
    <h2>Colors</h2>
    <ul class="swatches">
${swatches}
    </ul>
  </section>
  <aside class="panel">
    <h2>Details</h2>
    <div class="facts">
      <div><span>Colors</span><code>${n}</code></div>
      <div><span>Layout</span><code>${esc(layoutInfo(layout).name)}</code></div>
      <div><span>Size</span><code>1200 × 630</code></div>
      <div><span>Format</span><code>SVG</code></div>
      <div><span>License</span><code>free to use</code></div>
    </div>
    <h2 style="margin-top:26px">Routes</h2>
    <div class="facts">
      <div><span>Image</span><code>${esc(svgPath)}</code></div>
      <div><span>Page</span><code>${esc(pagePath)}</code></div>
    </div>
  </aside>
</div>

<section class="section">
  <h2>Use it</h2>
  <p class="sub">Everything is derived from the URL — no export step.</p>
  <div class="grid2">
    ${snippetCard("CSS variables", cssVars)}
    ${snippetCard("Tailwind v4", tailwind)}
    ${snippetCard("Markdown", markdown)}
    ${snippetCard("HTML", embed)}
  </div>
</section>`;

  return shell({
    title,
    description,
    canonical: pageUrl,
    ogImage: svgUrl,
    body,
  });
}

/* ---------------------------------------------------------------- landing -- */

interface LandingOptions {
  origin: string;
  error?: string;
  value?: string;
}

export function renderLanding({ origin, error, value = "" }: LandingOptions): string {
  const examples = EXAMPLES.map(({ colors, label }) => {
    const path = route(colors, DEFAULT_LAYOUT, "");
    const gradient = colors.join(", ");
    return `<a href="${esc(path)}"><i style="background:linear-gradient(90deg, ${gradient})"></i>${esc(
      label,
    )}</a>`;
  }).join("\n");

  const layoutCards = LAYOUTS.map((l) => {
    const colors = l.id === "scale" ? ["#ff3b30"] : SAMPLE;
    const img = route(colors, l.id, ".svg");
    const page = route(colors, l.id, "");
    return `<a class="layoutcard" href="${esc(page)}">
  <img src="${esc(img)}" alt="${esc(l.name)} layout" loading="lazy" width="1200" height="630">
  <div><b>${esc(l.name)}</b><small>${esc(l.blurb)}</small></div>
</a>`;
  }).join("\n");

  const body = `<section class="hero-copy">
  <p class="kicker"><b>Color palettes as images</b><span>·</span><span>SVG + HTML</span></p>
  <h1>Put colors<br><span>in the URL.</span></h1>
  <p class="lede">Type a few hex codes and get a palette image, a page, and copy-paste snippets. No export step, no accounts.</p>
  <form class="composer" method="get" action="/">
    <input name="colors" value="${esc(value)}" placeholder="#f94144, #f3722c, #f8961e" aria-label="Hex colors" autocomplete="off" spellcheck="false">
    <button class="btn" type="submit">Open palette</button>
  </form>
  ${error ? `<p class="err">${esc(error)}</p>` : ""}
  <div class="examples" id="examples">
    <span>Try:</span>
    ${examples}
    <a href="/random">Random</a>
  </div>
</section>

<section class="section" id="layouts">
  <h2>Six ways to show a palette</h2>
  <p class="sub">Switch with <code>?layout=</code> on any palette. Bands is the default.</p>
  <div class="layoutgrid">
${layoutCards}
  </div>
</section>

<section class="section" id="url">
  <h2>One URL, two faces</h2>
  <p class="sub">Same colors, different extension.</p>
  <div class="twocards">
    <div class="panel">
      <h3>Image</h3>
      <code>/{colors}.svg</code>
      <p>1200 × 630 SVG. Cache-friendly and infinitely sharp. Append <code>?layout=cards</code> for a different design.</p>
    </div>
    <div class="panel">
      <h3>Page</h3>
      <code>/{colors}</code>
      <p>Swatches, RGB values, CSS variables, Tailwind theme, and embed snippets.</p>
    </div>
  </div>
  <p class="hint">Colors are 3 or 6 hex digits joined with hyphens, up to 12. Example: <a href="/${SAMPLE.map(
    (c) => labelOf(c).toLowerCase(),
  ).join("-")}"><code>/${SAMPLE.map((c) => labelOf(c).toLowerCase()).join("-")}</code></a></p>
</section>`;

  return shell({
    title: "palette — color palettes as images",
    description: "Put hex colors in the URL and get an SVG palette image plus a shareable page.",
    canonical: origin + "/",
    ogImage: origin + route(SAMPLE, DEFAULT_LAYOUT, ".svg"),
    body,
  });
}

/* ------------------------------------------------------------------ error -- */

export function renderErrorPage(status: number, message: string): string {
  const body = `<p class="kicker">Error ${status}</p>
<h1>${esc(message)}</h1>
<p class="lede">Colors are 3 or 6 hex digits joined with hyphens, up to 12. For example:</p>
<p><code>/f94144-f3722c-f8961e-f9c74f.svg</code></p>
<p style="margin-top:28px"><a class="btn" href="/">Back to palette</a></p>`;
  return shell({
    title: `${status} — palette`,
    description: message,
    body,
  });
}
