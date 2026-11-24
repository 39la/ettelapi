# palette

URL にカラーコードを並べると SVG 画像と HTML ページを返す、Cloudflare Workers + Hono のサービス。

```
/f94144-f3722c-f8961e-f9c74f-90be6d-577590.svg   image
/f94144-f3722c-f8961e-f9c74f-90be6d-577590       page
/f94144-f3722c?layout=cards                       same colors, cards layout
/ff3b30?layout=scale                              tints & shades
```

## Routes

| Path                | Response                                                     |
| ------------------- | ------------------------------------------------------------ |
| `/{colors}.svg`     | SVG (1200 × 630, `immutable` cache)                          |
| `/{colors}`         | HTML page with swatches, CSS/Tailwind/Markdown/HTML snippets |
| `/random`           | 302 to a random palette page                                 |
| `/random.svg`       | 302 to a random palette image                                |
| `/healthz`          | `ok`                                                         |

- `{colors}`: 1–12 hex colors, 3 or 6 digits, joined with `-`. Case-insensitive, `#` optional.
- Commas and a leading `%23` are accepted and 301'd to the hyphen form.
- `?layout=` is `strip` (default), `cards`, `feature`, `mosaic`, `blobs`, or `scale`.
- `scale` only works with a single color (returns 400 otherwise).
- Invalid colors/layouts return a **400 SVG** for image URLs (a small error card) and an HTML error page otherwise.

## Layouts

| Layout    | Look                                         |
| --------- | -------------------------------------------- |
| `strip`   | Full-bleed bands. Default, any color count.  |
| `cards`   | Floating swatches on paper.                  |
| `feature` | Hero color + side list (tints when 1 color). |
| `mosaic`  | Gap grid; 5 colors uses a bento layout.      |
| `blobs`   | Overlapping circles (multiply).              |
| `scale`   | Base color + 5 tints + 5 shades.             |

## Development

```sh
bun install
bun run dev        # cf dev → http://localhost:8787
bun run build      # cf build
bun run validate   # cf build + cf deploy --dry-run (uploads nothing)
bun test
bun run check      # typecheck + lint + format check + tests
```

The project uses the new [`cf` CLI](https://developers.cloudflare.com/cf/), not Wrangler directly. `cf` is pinned as a dev dependency, so the global `cf` command runs the project's version.

```sh
cf --version
cf auth whoami
cf auth login      # only needed if the token expires
```

The account is pinned in `cloudflare.config.ts`. Production deploy is intentionally not run yet:

```sh
bun run deploy     # cf deploy (production)
```

Files:

- `src/index.ts` — Hono routes, validation, headers.
- `src/colors.ts` — parsing, RGB/luminance/contrast, random palettes.
- `src/layouts/` — one file per image layout (`strip`, `cards`, `feature`, `mosaic`, `blobs`, `scale`), plus `shared.ts` for the SVG primitives and `error.ts`.
- `src/layouts/index.ts` — layout registry, `renderSvg()`.
- `src/pages.ts` — server-rendered HTML (landing + palette page).
- `src/escape.ts`, `src/styles.css` — HTML escaping and the stylesheet (imported as text).
- `cloudflare.config.ts` — cf project config (account, worker name, entrypoint).
- `wrangler.config.ts` — bundler settings only; the `Text` rule inlines `styles.css` into the Worker.
- `test/` — parser, renderer, and route tests.

## Notes

- `cf` 1.0 is in release candidate. For a JavaScript Worker it delegates `dev`/`build`/`deploy` to Wrangler (esbuild), so Wrangler stays installed under the hood; the old `wrangler.jsonc` has been removed.
- `src/styles.css` is a real stylesheet, formatted by oxfmt, and imported as text via the `Text` module rule in `wrangler.config.ts`.
- `cf` runs on Node, not Bun. The npm scripts invoke the `cf` binary directly, so this is handled.
- **SVG only for now.** `og:image` points at the SVG; most crawlers (including X) won't render it. PNG via `@resvg/resvg-wasm` is the next step, plus a bundled font file.
- Fonts use the system stack. For a consistent image across machines, embed a subset of Inter later.
- Images are pure functions of the URL, hence `Cache-Control: immutable`; errors are `no-store`.
- SVG responses carry `CSP: default-src 'none'` and `X-Content-Type-Options: nosniff`.
- No database, KV, or R2. Random palettes are stateless.
- Design exploration lives in [`mockups/`](mockups/) (`node mockups/generate.mjs`, then open `mockups/index.html`). URL rationale is in [`docs/url-design.md`](docs/url-design.md).
