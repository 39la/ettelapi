// Generates design mockups as real SVG files (the same strings the Worker
// would return). Run: node mockups/generate.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");

const W = 1200;
const H = 630;

const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace";

/* ---------------------------------------------------------------- color ---- */

const rgbOf = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const toHex = (rgb) =>
  "#" +
  rgb
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

const mix = (a, b, t) => {
  const A = rgbOf(a);
  const B = rgbOf(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};

const relLum = (hex) => {
  const [r, g, b] = rgbOf(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (hex) => {
  const L = relLum(hex);
  const vsWhite = 1.05 / (L + 0.05);
  const vsBlack = (L + 0.05) / 0.05;
  return vsBlack >= vsWhite ? "#111111" : "#ffffff";
};

const ink = (hex) => (relLum(hex) > 0.06 ? hex : mix(hex, "#ffffff", 0.35));

/* ----------------------------------------------------------------- text ---- */

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const text = ({
  x,
  y,
  s,
  fs,
  fill,
  anchor = "start",
  family = MONO,
  weight = 400,
  ls = 0,
  opacity = 1,
  len,
}) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${fs}" font-weight="${weight}" ` +
  `fill="${fill}"${anchor !== "start" ? ` text-anchor="${anchor}"` : ""}` +
  `${ls ? ` letter-spacing="${ls}"` : ""}${opacity !== 1 ? ` opacity="${opacity}"` : ""}` +
  `${len ? ` textLength="${len}" lengthAdjust="spacingAndGlyphs"` : ""}>${esc(s)}</text>`;

const estWidth = (s, fs, ratio = 0.6) => s.length * fs * ratio;

const fit = (s, maxW, desired, ratio = 0.6, min = 9) =>
  Math.max(min, Math.min(desired, maxW / (s.length * ratio)));

const labelFor = (hex) => hex.slice(1).toUpperCase();

const doc = ({ title, bg, body }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(
    title,
  )}"><title>${esc(title)}</title>` +
  (bg ? `<rect width="${W}" height="${H}" fill="${bg}"/>` : "") +
  body +
  `</svg>`;

/* -------------------------------------------------------------- designs ---- */

// 01 — Full-bleed bands. Most predictable, works for any count.
function strip(colors) {
  const n = colors.length;
  const bandW = W / n;
  let g = "";

  colors.forEach((c, i) => {
    const x = i * bandW;
    const fg = contrast(c);
    const hex = labelFor(c);
    g += `<rect x="${x}" y="0" width="${bandW + 0.6}" height="${H}" fill="${c}"/>`;

    if (n === 1) {
      g += text({
        x: 72,
        y: 96,
        s: "PALETTE / 01",
        fs: 13,
        fill: fg,
        ls: 3,
        opacity: 0.6,
        family: MONO,
      });
      const big = fit("#" + hex, W - 144, 190, 0.62);
      g += text({ x: 68, y: H - 100, s: "#" + hex, fs: big, fill: fg, weight: 500 });
      g += text({
        x: 72,
        y: H - 48,
        s: "1 COLOR",
        fs: 13,
        fill: fg,
        ls: 3,
        opacity: 0.6,
        family: MONO,
      });
      g += text({
        x: W - 72,
        y: H - 48,
        s: "palette.example/" + hex,
        fs: 13,
        fill: fg,
        opacity: 0.6,
        anchor: "end",
      });
    } else {
      g += text({
        x: x + 20,
        y: 44,
        s: String(i + 1).padStart(2, "0"),
        fs: 12,
        fill: fg,
        ls: 2,
        opacity: 0.55,
        family: MONO,
      });
      const fs = fit(hex, bandW - 40, Math.min(22, bandW * 0.1), 0.6);
      g += text({ x: x + 20, y: H - 26, s: hex, fs, fill: fg, ls: Math.max(0.5, fs * 0.05) });
    }
  });

  return doc({ title: "palette strip", body: g });
}

// 02 — Cards on a paper background. Warm, "designer swatch" feel.
function cards(colors) {
  const n = colors.length;
  const pad = 56;
  const gap = 18;
  const top = 112;
  const capH = 48; // room for the hex caption under each card
  const cardH = H - pad - top - capH;
  const bg = "#F4F3EF";

  let g = `<rect x="${pad}" y="72" width="6" height="6" rx="1" fill="#111" opacity="0.8"/>`;
  g += text({
    x: pad + 16,
    y: 80,
    s: "PALETTE",
    fs: 13,
    fill: "#111",
    ls: 3.5,
    weight: 600,
    family: SANS,
  });
  g += text({
    x: W - pad,
    y: 80,
    s: `${n} ${n === 1 ? "COLOR" : "COLORS"}`,
    fs: 12,
    fill: "#111",
    ls: 2,
    opacity: 0.45,
    anchor: "end",
  });

  if (n === 1) {
    const cw = Math.min(560, W - pad * 2);
    const cx = (W - cw) / 2;
    const ch = cardH;
    g += `<rect x="${cx}" y="${top}" width="${cw}" height="${ch}" rx="22" fill="${colors[0]}"/>`;
    const fg = contrast(colors[0]);
    g += text({
      x: cx + 40,
      y: top + ch - 40,
      s: "#" + labelFor(colors[0]).toLowerCase(),
      fs: 38,
      fill: fg,
      weight: 500,
    });
    g += text({
      x: W / 2,
      y: top + ch + 34,
      s: "palette.example/" + labelFor(colors[0]).toLowerCase(),
      fs: 13,
      fill: "#111",
      opacity: 0.45,
      anchor: "middle",
      ls: 1,
    });
    return doc({ title: "palette card", bg, body: g });
  }

  const cw = (W - pad * 2 - gap * (n - 1)) / n;
  colors.forEach((c, i) => {
    const x = pad + i * (cw + gap);
    const fg = contrast(c);
    g += `<rect x="${x}" y="${top}" width="${cw}" height="${cardH}" rx="16" fill="${c}"/>`;
    g += text({
      x: x + 14,
      y: top + 26,
      s: String(i + 1).padStart(2, "0"),
      fs: 11,
      fill: fg,
      ls: 1.5,
      opacity: 0.5,
    });
    const fs = fit(labelFor(c), cw - 28, 15, 0.6);
    g += text({
      x: x + cw / 2,
      y: top + cardH + 30,
      s: labelFor(c),
      fs,
      fill: "#111",
      opacity: 0.6,
      anchor: "middle",
      ls: 0.8,
    });
  });

  g += text({
    x: W - pad,
    y: H - 16,
    s:
      "palette.example/" +
      colors
        .map(labelFor)
        .map((s) => s.toLowerCase())
        .join("-"),
    fs: 11,
    fill: "#111",
    opacity: 0.35,
    anchor: "end",
    ls: 0.5,
  });

  return doc({ title: "palette cards", bg, body: g });
}

// 03 — Featured color + side list. Strong at 1 and 2 colors, fine up to 8.
function feature(colors) {
  const split = Math.round(W * 0.56);
  const base = colors[0];
  const rest = colors.slice(1);
  const showTints = rest.length === 0;
  const items = showTints
    ? [0.85, 0.65, 0.45, 0.25, 0.1].map((t) => mix(base, "#ffffff", t))
    : rest;

  let g = `<rect x="0" y="0" width="${split + 1}" height="${H}" fill="${base}"/>`;
  g += `<rect x="${split}" y="0" width="${W - split}" height="${H}" fill="#101012"/>`;

  const fg = contrast(base);
  g += text({ x: 56, y: 68, s: "FEATURED", fs: 12, fill: fg, ls: 3.5, opacity: 0.65 });
  const big = fit("#" + labelFor(base), split - 112, 92, 0.62);
  g += text({ x: 52, y: H - 64, s: "#" + labelFor(base), fs: big, fill: fg, weight: 500 });
  g += text({
    x: 56,
    y: H - 30,
    s: "palette.example/" + labelFor(base).toLowerCase(),
    fs: 12,
    fill: fg,
    opacity: 0.55,
  });

  const padX = split + 52;
  const padTop = 76;
  const padBottom = 56;
  const rowH = (H - padTop - padBottom) / items.length;
  g += text({
    x: padX,
    y: 56,
    s: showTints ? "TINTS" : "PALETTE",
    fs: 12,
    fill: "#ffffff",
    ls: 3.5,
    opacity: 0.4,
  });
  g += text({
    x: W - 52,
    y: 56,
    s: `${colors.length} ${colors.length === 1 ? "COLOR" : "COLORS"}`,
    fs: 12,
    fill: "#ffffff",
    ls: 2,
    opacity: 0.3,
    anchor: "end",
  });

  items.forEach((c, i) => {
    const cy = padTop + rowH * i + rowH / 2;
    const chip = Math.min(52, rowH - 18);
    g += `<rect x="${padX}" y="${cy - chip / 2}" width="${chip}" height="${chip}" rx="10" fill="${c}"/>`;
    g += text({
      x: padX + chip + 20,
      y: cy + 5,
      s: "#" + labelFor(c).toLowerCase(),
      fs: 16,
      fill: "#ffffff",
      opacity: 0.9,
    });
    g += text({
      x: W - 52,
      y: cy + 5,
      s: showTints ? `T${String(i + 1).padStart(2, "0")}` : String(i + 2).padStart(2, "0"),
      fs: 12,
      fill: "#ffffff",
      opacity: 0.3,
      anchor: "end",
      ls: 1,
    });
  });

  return doc({ title: "palette feature", body: g });
}

// 04 — Bento mosaic. Best for 4–8 colors; gaps read as a grid.
function mosaic(colors) {
  const n = colors.length;
  const gap = 10;
  const pad = 20;
  let cells; // {x,y,w,h,i}

  if (n === 1) {
    cells = [{ x: pad, y: pad, w: W - pad * 2, h: H - pad * 2, i: 0 }];
  } else if (n === 5) {
    const totalW = W - pad * 2;
    const totalH = H - pad * 2;
    const leftW = (totalW - gap) * 0.5;
    const rightW = totalW - gap - leftW;
    const cellH = (totalH - gap) / 2;
    const rightW2 = (rightW - gap) / 2;
    cells = [{ x: pad, y: pad, w: leftW, h: totalH, i: 0 }];
    for (let i = 0; i < 4; i++) {
      const r = Math.floor(i / 2);
      const c = i % 2;
      cells.push({
        x: pad + leftW + gap + c * (rightW2 + gap),
        y: pad + r * (cellH + gap),
        w: rightW2,
        h: cellH,
        i: i + 1,
      });
    }
  } else {
    const cols = n <= 3 ? n : n <= 4 ? 2 : n <= 6 ? 3 : 4;
    const rows = Math.ceil(n / cols);
    const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
    const ch = (H - pad * 2 - gap * (rows - 1)) / rows;
    cells = colors.map((_, i) => ({
      x: pad + (i % cols) * (cw + gap),
      y: pad + Math.floor(i / cols) * (ch + gap),
      w: cw,
      h: ch,
      i,
    }));
  }

  let g = `<rect width="${W}" height="${H}" fill="#0B0B0C"/>`;
  cells.forEach(({ x, y, w, h, i }) => {
    const c = colors[i];
    const fg = contrast(c);
    g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${c}"/>`;
    g += text({
      x: x + 18,
      y: y + 28,
      s: String(i + 1).padStart(2, "0"),
      fs: 11,
      fill: fg,
      ls: 1.5,
      opacity: 0.5,
    });
    g += text({ x: x + 18, y: y + h - 18, s: labelFor(c), fs: 15, fill: fg, ls: 0.5 });
  });

  return doc({ title: "palette mosaic", body: g });
}

// 05 — Overlapping circles (multiply). Playful, best at 3–6.
function blobs(colors) {
  const n = colors.length;
  const bg = "#FBFAF7";
  let g = "";
  g += text({
    x: 56,
    y: 68,
    s: "PALETTE",
    fs: 13,
    fill: "#111",
    ls: 3.5,
    opacity: 0.55,
    weight: 600,
    family: SANS,
  });

  if (n === 1) {
    const c = colors[0];
    const r = 190;
    g += `<circle cx="${W / 2}" cy="${H / 2 - 20}" r="${r}" fill="${c}"/>`;
    g += text({
      x: W / 2,
      y: H / 2 - 8,
      s: "#" + labelFor(c),
      fs: 40,
      fill: contrast(c),
      anchor: "middle",
      weight: 500,
    });
    g += text({
      x: W / 2,
      y: H / 2 + 30,
      s: "1 COLOR",
      fs: 12,
      fill: contrast(c),
      anchor: "middle",
      ls: 3,
      opacity: 0.6,
    });
    g += text({
      x: W - 56,
      y: H - 32,
      s: "palette.example/ff3b30",
      fs: 11,
      fill: "#111",
      opacity: 0.3,
      anchor: "end",
    });
    return doc({ title: "palette circles", bg, body: g });
  }

  const r = Math.min(H * 0.3, 260 / Math.sqrt(n / 3), (W - 220) / (n * 1.35));
  const spacing = Math.min(r * 1.5, (W - 220 - r * 2) / Math.max(1, n - 1));
  const span = r * 2 + spacing * (n - 1);
  const start = (W - span) / 2 + r;

  colors.forEach((c, i) => {
    const cx = start + spacing * i;
    const cy = H * 0.47 + (i % 2 === 0 ? -14 : 14);
    g += `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r.toFixed(1)}" fill="${c}" style="mix-blend-mode:multiply"/>`;
    g += text({
      x: cx.toFixed(1),
      y: (cy + r + 46).toFixed(1),
      s: labelFor(c),
      fs: 13,
      fill: "#111",
      opacity: 0.65,
      anchor: "middle",
      ls: 0.8,
    });
    g += text({
      x: cx.toFixed(1),
      y: (cy + r + 66).toFixed(1),
      s: String(i + 1).padStart(2, "0"),
      fs: 10,
      fill: "#111",
      opacity: 0.3,
      anchor: "middle",
      ls: 2,
    });
  });

  g += text({ x: 56, y: H - 32, s: `${n} COLORS`, fs: 11, fill: "#111", ls: 2.5, opacity: 0.3 });
  g += text({
    x: W - 56,
    y: H - 32,
    s:
      "palette.example/" +
      colors
        .map(labelFor)
        .map((s) => s.toLowerCase())
        .join("-"),
    fs: 11,
    fill: "#111",
    opacity: 0.3,
    anchor: "end",
  });

  return doc({ title: "palette circles", bg, body: g });
}

// 06 — Single-color detail: base + 11 tint/shade steps.
function scale(colors) {
  const base = colors[0];
  const top = 286;
  const steps = [];
  for (let i = 0; i < 5; i++)
    steps.push({ c: mix(base, "#ffffff", 0.9 - i * 0.18), tag: `T${i + 1}` });
  steps.push({ c: base, tag: "BASE" });
  for (let i = 0; i < 5; i++)
    steps.push({ c: mix(base, "#000000", 0.12 + i * 0.16), tag: `S${i + 1}` });

  let g = `<rect x="0" y="0" width="${W}" height="${top}" fill="${base}"/>`;
  const fg = contrast(base);
  g += text({ x: 56, y: 66, s: "COLOR / SCALE", fs: 12, fill: fg, ls: 3.5, opacity: 0.65 });
  const big = fit("#" + labelFor(base), W - 112, 84, 0.62);
  g += text({ x: 52, y: top - 52, s: "#" + labelFor(base), fs: big, fill: fg, weight: 500 });
  g += text({
    x: W - 56,
    y: top - 56,
    s: "TINTS → SHADES",
    fs: 12,
    fill: fg,
    ls: 2.5,
    opacity: 0.6,
    anchor: "end",
  });

  const stepW = W / steps.length;
  steps.forEach(({ c, tag }, i) => {
    const x = i * stepW;
    const f = contrast(c);
    g += `<rect x="${x}" y="${top}" width="${stepW + 0.6}" height="${H - top}" fill="${c}"/>`;
    g += text({ x: x + 12, y: top + 26, s: tag, fs: 9, fill: f, ls: 1.2, opacity: 0.55 });
    g += text({ x: x + 12, y: H - 18, s: labelFor(c), fs: 11, fill: f, ls: 0.3 });
  });

  return doc({ title: "color scale", body: g });
}

/* ---------------------------------------------------------------- build ---- */

const PALETTES = {
  1: ["#FF3B30"],
  4: ["#264653", "#2A9D8F", "#E9C46A", "#F4A261"],
  5: ["#03071E", "#370617", "#6A040F", "#D00000", "#FFBA08"],
  6: ["#F94144", "#F3722C", "#F8961E", "#F9C74F", "#90BE6D", "#577590"],
};

const DESIGNS = [
  {
    id: "strip",
    fn: strip,
    name: "01 / Bands",
    note: "Full-bleed equal bands. Predictable for any count; the safe default.",
  },
  {
    id: "cards",
    fn: cards,
    name: "02 / Cards",
    note: "Paper background, floating swatches. Warmer and more editorial.",
  },
  {
    id: "feature",
    fn: feature,
    name: "03 / Featured",
    note: "One hero color + side list. Strongest at 1–2 colors.",
  },
  {
    id: "mosaic",
    fn: mosaic,
    name: "04 / Bento",
    note: "Gap grid. Best from 4 colors up; 5 uses a bento layout.",
  },
  {
    id: "blobs",
    fn: blobs,
    name: "05 / Circles",
    note: "Overlapping circles with multiply. Playful, 3–6 colors.",
  },
  {
    id: "scale",
    fn: scale,
    name: "06 / Scale",
    note: "Single-color detail: base + tints/shades. Only used at n=1.",
  },
];

const files = [];
for (const d of DESIGNS) {
  for (const [count, colors] of Object.entries(PALETTES)) {
    if (d.id === "scale" && count !== "1") continue;
    const file = `${d.id}-${count}.svg`;
    await mkdir(OUT, { recursive: true });
    await writeFile(join(OUT, file), d.fn(colors));
    files.push({ design: d.id, count, file, url: sampleUrl(colors, d.id) });
  }
}

function sampleUrl(colors, layout) {
  const slug = colors.map((c) => labelFor(c).toLowerCase()).join("-");
  return `/${slug}.svg?layout=${layout}`;
}

// ---- web page mock ----------------------------------------------------------

function pageMock(colors) {
  const slug = colors.map((c) => labelFor(c).toLowerCase()).join("-");
  const hexes = colors.map((c) => c.toLowerCase());

  const ratio = (a, b) => {
    const [x, y] = [relLum(a), relLum(b)].sort((m, n) => n - m);
    return ((x + 0.05) / (y + 0.05)).toFixed(1);
  };

  const rows = colors
    .map((c, i) => {
      const onWhite = ratio(c, "#ffffff");
      const onBlack = ratio(c, "#000000");
      const best = Number(onWhite) >= Number(onBlack) ? ["white", onWhite] : ["black", onBlack];
      return `<li class="swatch">
  <span class="chip" style="background:${c}"></span>
  <span class="hex"><b>#${labelFor(c).toLowerCase()}</b><small>rgb(${rgbOf(c).join(", ")})</small></span>
  <span class="badge ${best[0]}">${best[0]} text ${best[1]}:1</span>
  <button class="ghost" data-copy="${c.toLowerCase()}">copy</button>
</li>`;
    })
    .join("\n");

  const cssVars = `:root {\n${hexes.map((c, i) => `  --palette-${i + 1}: ${c};`).join("\n")}\n}`;
  const tw = `@theme {\n${hexes.map((c, i) => `  --color-palette-${i + 1}: ${c};`).join("\n")}\n}`;
  const json = `{\n  "colors": [${hexes.map((c) => `"${c}"`).join(", ")}],\n  "url": "https://palette.example/${slug}.svg"\n}`;
  const md = `![${colors.length}-color palette](https://palette.example/${slug}.svg)`;

  const related = [
    ["070d0d", "1b3a4b", "2e6f67", "c2d8b9"],
    ["1a1423", "372549", "774c60", "b75d69", "eacdc2"],
    ["0b132b", "1c2541", "3a506b", "5bc0be", "6fffe9"],
  ]
    .map((p, i) => {
      const stops = p
        .map((c, j) => `#${c} ${(j / p.length) * 100}% ${((j + 1) / p.length) * 100}%`)
        .join(", ");
      return `<a class="mini" href="#"><span style="background:linear-gradient(90deg, ${stops})"></span><small>${p.length} colors</small></a>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${colors.length}-color palette — palette</title>
<meta name="description" content="A ${colors.length}-color palette. ${hexes.join(" ")}">
<meta property="og:type" content="website">
<meta property="og:title" content="${colors.length}-color palette">
<meta property="og:description" content="${hexes.join(" ")}">
<meta property="og:image" content="https://palette.example/${slug}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://palette.example/${slug}">
<style>
  :root { --bg:#f6f6f2; --panel:#fff; --ink:#111; --mut:#71717a; --line:#e4e4df; --acc:#111; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.6 Inter,-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif; }
  .wrap { max-width:1120px; margin:0 auto; padding:0 24px 96px; }
  a { color:inherit; }
  header.nav { display:flex; align-items:center; gap:28px; padding:22px 0; border-bottom:1px solid var(--line); }
  .brand { display:flex; align-items:center; gap:9px; font-weight:600; letter-spacing:-.01em; text-decoration:none; }
  .brand i { width:14px; height:14px; border-radius:4px; background:linear-gradient(135deg,#f94144,#f9c74f 45%,#577590); display:block; }
  header.nav nav { display:flex; gap:20px; font-size:13px; color:var(--mut); }
  header.nav nav a { text-decoration:none; }
  header.nav nav a:hover { color:var(--ink); }
  header.nav .btn { margin-left:auto; }
  .btn { display:inline-flex; align-items:center; gap:6px; border:0; background:#111; color:#fff; font:inherit; font-size:13px; font-weight:500; padding:8px 14px; border-radius:8px; text-decoration:none; cursor:pointer; }
  .btn.sec { background:#fff; color:#111; border:1px solid var(--line); }
  .kicker { margin-top:44px; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--mut); display:flex; gap:10px; align-items:center; }
  .kicker b { font-weight:500; color:var(--ink); }
  h1 { font-size:34px; letter-spacing:-.025em; margin:8px 0 18px; line-height:1.15; }
  .urlbar { display:flex; align-items:center; gap:12px; background:#fff; border:1px solid var(--line); border-radius:10px; padding:10px 12px; margin-bottom:18px; }
  .urlbar code { font-size:12.5px; color:var(--mut); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .urlbar .btn { margin-left:auto; flex:none; }
  .hero { background:#fff; border:1px solid var(--line); border-radius:14px; padding:10px; }
  .hero img { width:100%; height:auto; display:block; border-radius:8px; }
  .toolbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:14px 0 40px; }
  .seg { display:inline-flex; background:#fff; border:1px solid var(--line); border-radius:8px; padding:2px; }
  .seg button { border:0; background:transparent; font:inherit; font-size:12px; padding:5px 10px; border-radius:6px; cursor:pointer; color:var(--mut); }
  .seg button.on { background:#111; color:#fff; }
  .toolbar .spacer { margin-left:auto; }
  .fmt { font-size:12px; color:var(--mut); }
  .cols { display:grid; grid-template-columns: 1.5fr 1fr; gap:20px; align-items:start; }
  .panel { background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px 22px; }
  .panel h2 { font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--mut); font-weight:500; margin:0 0 14px; }
  ul.swatches { list-style:none; margin:0; padding:0; }
  li.swatch { display:flex; align-items:center; gap:12px; padding:9px 0; border-top:1px solid var(--line); }
  li.swatch:first-child { border-top:0; padding-top:0; }
  .chip { width:34px; height:34px; border-radius:7px; flex:none; box-shadow:inset 0 0 0 1px rgb(0 0 0 / .06); }
  .hex { display:flex; flex-direction:column; line-height:1.25; }
  .hex b { font:500 13.5px/1.3 "SF Mono", ui-monospace, Menlo, monospace; }
  .hex small { font-size:11px; color:var(--mut); }
  .badge { margin-left:auto; font-size:10.5px; color:var(--mut); border:1px solid var(--line); padding:2px 7px; border-radius:999px; white-space:nowrap; }
  .ghost { border:1px solid var(--line); background:#fff; font:inherit; font-size:11px; padding:3px 9px; border-radius:6px; cursor:pointer; color:var(--mut); }
  .ghost:hover { color:#111; border-color:#bbb; }
  .facts { font-size:13px; }
  .facts div { display:flex; justify-content:space-between; gap:12px; padding:6px 0; border-top:1px solid var(--line); }
  .facts div:first-of-type { border-top:0; }
  .facts span { color:var(--mut); }
  .facts code { font-size:11.5px; }
  .use { margin-top:56px; }
  .use h2 { font-size:20px; letter-spacing:-.02em; margin:0 0 16px; }
  .grid4 { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
  .code { background:#0e0e10; color:#e7e7e9; border-radius:12px; overflow:hidden; }
  .code header { display:flex; align-items:center; gap:8px; padding:9px 14px; border-bottom:1px solid #232326; font-size:11px; color:#8b8b93; }
  .code header button { margin-left:auto; background:transparent; border:1px solid #2e2e33; color:#b9b9c0; font:inherit; font-size:10.5px; padding:2px 8px; border-radius:5px; cursor:pointer; }
  .code pre { margin:0; padding:14px; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; font:11.5px/1.7 "SF Mono", ui-monospace, Menlo, monospace; }
  .related { margin-top:56px; }
  .related h2 { font-size:20px; letter-spacing:-.02em; margin:0 0 16px; }
  .minis { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .mini { text-decoration:none; display:block; border-radius:12px; overflow:hidden; border:1px solid var(--line); background:#fff; padding-bottom:8px; }
  .mini span { display:block; height:74px; }
  .mini small { display:block; padding:7px 10px 0; font-size:11px; color:var(--mut); }
  footer { margin-top:64px; padding-top:20px; border-top:1px solid var(--line); display:flex; justify-content:space-between; gap:16px; font-size:12px; color:var(--mut); flex-wrap:wrap; }
  footer a { color:var(--mut); }
  .toast { position:fixed; bottom:24px; left:50%; transform:translate(-50%,10px); background:#111; color:#fff; font-size:12px; padding:8px 14px; border-radius:8px; opacity:0; transition:.18s; pointer-events:none; }
  .toast.show { opacity:1; transform:translate(-50%,0); }
  @media (max-width: 820px) { .cols, .grid4, .minis { grid-template-columns:1fr; } }
  @media (max-width: 640px) { header.nav nav { display:none; } .kicker { margin-top:28px; } h1 { font-size:26px; } .toolbar .fmt { display:none; } }
</style>
</head>
<body>
<div class="wrap">
  <header class="nav">
    <a class="brand" href="index.html"><i></i>palette</a>
    <nav><a href="index.html">Image designs</a><a href="index.html#routes">URL design</a><a href="#">API</a></nav>
    <a class="btn" href="#">Random palette</a>
  </header>

  <p class="kicker"><b>${colors.length}-color palette</b><span>·</span><span>generated on the fly</span></p>
  <h1>${hexes.map((c) => c.toUpperCase()).join(" ")}</h1>

  <div class="urlbar">
    <code>palette.example/${slug}</code>
    <button class="btn sec" data-copy="https://palette.example/${slug}">Copy page URL</button>
  </div>

  <div class="hero">
    <img id="hero" src="out/cards-6.svg" alt="${colors.length}-color palette image" width="1200" height="630">
  </div>

  <div class="toolbar">
    <div class="seg" id="layouts">
      <button class="on" data-img="out/cards-6.svg">Cards</button>
      <button data-img="out/strip-6.svg">Bands</button>
      <button data-img="out/mosaic-6.svg">Bento</button>
      <button data-img="out/blobs-6.svg">Circles</button>
    </div>
    <span class="fmt">1200 × 630</span>
    <span class="spacer"></span>
    <button class="btn sec" data-copy="https://palette.example/${slug}.svg">Copy SVG URL</button>
    <button class="btn" data-copy="https://palette.example/${slug}.png">Copy PNG URL</button>
  </div>

  <div class="cols">
    <section class="panel">
      <h2>Colors</h2>
      <ul class="swatches">
${rows}
      </ul>
    </section>
    <aside class="panel">
      <h2>Details</h2>
      <div class="facts">
        <div><span>Colors</span><code>${colors.length}</code></div>
        <div><span>Image</span><code>SVG · PNG</code></div>
        <div><span>Formats</span><code>hex · rgb</code></div>
        <div><span>License</span><code>free to use</code></div>
      </div>
      <h2 style="margin-top:26px">Embed</h2>
      <div class="facts">
        <div><span>HTML</span><code>&lt;img src="…/${slug}.svg"&gt;</code></div>
        <div><span>Markdown</span><code>![](&hellip;/${slug}.svg)</code></div>
      </div>
    </aside>
  </div>

  <section class="use">
    <h2>Use it</h2>
    <div class="grid4">
      <div class="code">
        <header>CSS variables <button data-copy="${cssVars.replace(/"/g, "&quot;")}">copy</button></header>
        <pre>${esc(cssVars)}</pre>
      </div>
      <div class="code">
        <header>Tailwind v4 <button data-copy="${tw.replace(/"/g, "&quot;")}">copy</button></header>
        <pre>${esc(tw)}</pre>
      </div>
      <div class="code">
        <header>palette.json <button data-copy="${json.replace(/"/g, "&quot;")}">copy</button></header>
        <pre>${esc(json)}</pre>
      </div>
      <div class="code">
        <header>Markdown <button data-copy="${md.replace(/"/g, "&quot;")}">copy</button></header>
        <pre>${esc(md)}</pre>
      </div>
    </div>
  </section>

  <section class="related">
    <h2>More like this</h2>
    <div class="minis">
${related}
    </div>
  </section>

  <footer>
    <span>Images are rendered per request. No accounts, no tracking.</span>
    <span>Free to use — a link back is appreciated.</span>
  </footer>
</div>
<div class="toast" id="toast">Copied</div>
<script>
  const toast = document.getElementById("toast");
  const show = (m) => { toast.textContent = m; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 1100); };
  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(el.dataset.copy); show("Copied " + (el.dataset.copy.length > 34 ? "URL" : el.dataset.copy)); }
      catch { show("Copy failed"); }
    });
  });
  const hero = document.getElementById("hero");
  document.querySelectorAll("#layouts button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#layouts button").forEach((x) => x.classList.toggle("on", x === b));
      hero.src = b.dataset.img;
    });
  });
</script>
</body>
</html>`;
}

// ---- gallery ----------------------------------------------------------------

const counts = ["1", "4", "5", "6"];
const sections = DESIGNS.filter((d) => d.id !== "scale")
  .map((d) => {
    const cards = counts
      .map((c) => {
        const f = files.find((x) => x.design === d.id && x.count === c);
        return `<figure class="shot">
  <img src="out/${f.file}" alt="${d.name}, ${c} colors" loading="lazy">
  <figcaption><code>${f.url}</code></figcaption>
</figure>`;
      })
      .join("\n");
    return `<section id="${d.id}">
  <header><h2>${d.name}</h2><p>${d.note}</p></header>
  <div class="shots">${cards}</div>
</section>`;
  })
  .join("\n");

const scaleShot = `<section id="scale">
  <header><h2>06 / Scale</h2><p>${DESIGNS.find((d) => d.id === "scale").note}</p></header>
  <div class="shots one">
    <figure class="shot"><img src="out/scale-1.svg" alt="color scale" loading="lazy"><figcaption><code>/ff3b30.svg?layout=scale</code></figcaption></figure>
  </div>
</section>`;

const routes = [
  [
    "A",
    "Hyphen path + extension",
    "<code>/ff3b30-f94144-577590.svg</code>",
    "Short, paste-safe, no escaping. Canonical pick.",
  ],
  [
    "B",
    "Slash segments",
    "<code>/p/ff3b30/f94144/577590.svg</code>",
    "Robust parsing, but long and noisy.",
  ],
  [
    "C",
    "Comma path",
    "<code>/ff3b30,f94144,577590.svg</code>",
    "Prettiest, but clients often escape <code>,</code> to <code>%2C</code>.",
  ],
  [
    "D",
    "Query only",
    "<code>/palette?c=ff3b30,f94144&format=svg</code>",
    "Flexible, but the URL doesn't read as an image.",
  ],
  [
    "E",
    "Hybrid (A + aliases)",
    "<code>/ff3b30-f94144.svg</code>",
    "Canonical A, 301 the others. HTML at the extension-less URL.",
  ],
];

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>palette — design & routing candidates</title>
<style>
  :root { color-scheme: dark; --bg:#0b0b0c; --panel:#141416; --line:#26262a; --fg:#e9e9ea; --mut:#8b8b93; --acc:#f9c74f; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font: 15px/1.6 Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; }
  .wrap { max-width: 1180px; margin: 0 auto; padding: 72px 28px 120px; }
  h1 { font-size: 40px; line-height:1.1; letter-spacing:-0.02em; margin:0 0 12px; }
  .lede { color:var(--mut); max-width: 62ch; margin:0 0 40px; }
  h2 { font-size: 19px; margin:0; letter-spacing:-0.01em; }
  h2 code { color: var(--acc); font-size: 13px; letter-spacing:0; }
  section { margin-top: 64px; scroll-margin-top: 24px; }
  section > header { display:flex; align-items:baseline; gap:16px; flex-wrap:wrap; border-top:1px solid var(--line); padding-top:20px; margin-bottom:20px; }
  section > header p { margin:0; color:var(--mut); font-size:13px; }
  .shots { display:grid; grid-template-columns: repeat(2, 1fr); gap:16px; }
  .shots.one { grid-template-columns: minmax(0, 760px); }
  figure { margin:0; }
  .shot img { width:100%; display:block; border-radius:10px; border:1px solid var(--line); background:#000; }
  figcaption { padding-top:8px; }
  figcaption code { font-size:11px; color:var(--mut); word-break:break-all; }
  .routes { width:100%; border-collapse:collapse; font-size:13px; }
  .routes th, .routes td { text-align:left; padding:12px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
  .routes th { color:var(--mut); font-weight:500; font-size:11px; letter-spacing:.1em; text-transform:uppercase; }
  .routes td:first-child { color:var(--acc); width:28px; }
  .routes code { font-size:12px; background:var(--panel); padding:2px 6px; border-radius:4px; }
  nav.top { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:40px; }
  nav.top a { color:var(--fg); text-decoration:none; font-size:12px; border:1px solid var(--line); padding:5px 10px; border-radius:999px; }
  nav.top a:hover { border-color:var(--acc); color:var(--acc); }
  .note { border:1px solid var(--line); background:var(--panel); border-radius:12px; padding:18px 20px; color:var(--mut); font-size:13px; }
  .note strong { color:var(--fg); }
  .note code { color:var(--acc); }
  @media (max-width: 900px) { .shots { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="wrap">
  <h1>palette — image designs</h1>
  <p class="lede">Every mockup below is a real SVG at 1200×630, generated from the same code path the Worker would use. Nothing is a screenshot, so what you see is exactly what the endpoint returns.</p>

  <nav class="top">
    ${DESIGNS.map((d) => `<a href="#${d.id}">${d.name}</a>`).join("\n    ")}
    <a href="#routes">Routing</a>
    <a href="page.html">Web page mock →</a>
  </nav>

  ${sections}
  ${scaleShot}

  <section id="routes">
    <header><h2>URL / routing candidates</h2><p>Same content, different URL shapes. All accept 3- and 6-digit hex.</p></header>
    <table class="routes">
      <thead><tr><th></th><th>Shape</th><th>Example</th><th>Trade-off</th></tr></thead>
      <tbody>
        ${routes.map(([id, name, ex, why]) => `<tr><td>${id}</td><td>${name}</td><td>${ex}</td><td>${why}</td></tr>`).join("\n        ")}
      </tbody>
    </table>
    <div class="note" style="margin-top:22px">
      <strong>Recommendation:</strong> canonical <code>/{hex-hex-hex}.svg</code>, HTML at the same path without the extension, and <code>?layout=</code>, <code>?w=</code>, <code>?theme=</code> for options.
      Serve SVG by default; add <code>.png</code> via resvg-wasm for <code>og:image</code>, since most crawlers still refuse SVG.
    </div>
  </section>
</div>
</body>
</html>`;

await writeFile(join(HERE, "index.html"), html);
await writeFile(join(HERE, "page.html"), pageMock(PALETTES["6"]));
console.log(`wrote ${files.length} svg + index.html + page.html`);
