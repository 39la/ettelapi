# ettelapi

URL にカラーコードを並べると SVG 画像と HTML ページを返す、Cloudflare Workers + Hono のサービス。

Live: <https://ettelapi.saqula.workers.dev>

```
/f94144-f3722c-f8961e-f9c74f-90be6d-577590.svg   image
/f94144-f3722c-f8961e-f9c74f-90be6d-577590       page
/f94144-f3722c?layout=cards                       same colors, cards layout
/ff3b30?layout=scale                              tints & shades
/ff3b30.svg?w=1080&h=1080                        square image
/ff3b30?accent=1d4ed8                             tinted labels (single color)
```

## Routes

| Path            | Response                                                     |
| --------------- | ------------------------------------------------------------ |
| `/{colors}.svg` | SVG (default 1200 × 630, `immutable` cache)                  |
| `/{colors}`     | HTML page with swatches, CSS/Tailwind/Markdown/HTML snippets |
| `/random`       | 302 to a random palette page                                 |
| `/random.svg`   | 302 to a random palette image                                |
| `/healthz`      | `ok`                                                         |
| `/llms.txt`     | plain-text brief for LLM crawlers                            |

- `{colors}`: 1–12 hex colors, 3 or 6 digits, joined with `-`. Case-insensitive, `#` optional.
- Commas and a leading `%23` are accepted and 301'd to the hyphen form.
- `?layout=` is `strip` (default), `cards`, `feature`, `mosaic`, `blobs`, or `scale`.
- `?w=` and `?h=` resize the image. Default 1200 × 630; each side is clamped to 16–4096 and the area to 4 MP.
- `?accent=` overrides the label accent for single-color palettes. Without it, labels use a deep tone of the color. Multi-color palettes keep black/white labels.
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


```sh
bun run deploy     # cf deploy (production)
```
