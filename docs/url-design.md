# URL / routing design

カラーコードをパスに並べて画像を返すときの URL 設計。結論は **A（ハイフン区切り + 拡張子）を canonical** にして、B/C/D は 301 で寄せる、拡張子なしは HTML ページ。

## 前提・制約

- `#` は URL の fragment なのでパスに置けない。hex だけを受け取る（`%23` が来たら剥がして 301）。
- 区切りに使える文字のうち `-` は hex に現れないので衝突しない。`_`, `~` も安全だが読みにくい。
- 大文字小文字は同一視。内部で小文字に正規化し、表示は大文字。
- 3 桁 hex（`f00` → `ff0000`）は展開して受け入れる。8 桁（alpha）は当面 400（後で `fill-opacity` に対応可能）。
- 色数は 12 まで（実用上は 8 以下を推奨）。超過は 400。
- 画像は**拡張子で形式を決める**。`Content-Type` と OG クローラ・保存・ホットリンクの相性が良い。

## 案

### A. ハイフン + 拡張子（推奨 / canonical）

```
/ff3b30.svg
/f94144-f3722c-f8961e-f9c74f-90be6d-577590.svg
/f00-0f0.svg?layout=cards&w=1200&h=630
```

- 短い・コピペで壊れない・エスケープ不要。`-` は hex に現れないので曖昧さゼロ。
- 1 色も複数色も同じ形。`/ff3b30` と `/f94144-...` で特別扱いが不要。
- 12 色でも約 85 文字。URL 長は問題ない。
- 欠点: パッと見で「パレット」と分かりにくい（区切りが地味）。OG の alt で補う。

### B. スラッシュ区切り（REST 風）

```
/c/ff3b30.svg
/p/f94144/f3722c/f8961e/f9c74f.svg
```

- セグメント単位でパースでき、1 色ずつバリデーションしやすい。将来 `/p/{colors}/{layout}.svg` に拡張可能。
- 長い。末尾スラッシュ・二重スラッシュの正規化が必要。ルーターのルールも増える。
- canonical にする理由は弱い。エイリアス向き。

### C. カンマ区切り

```
/f94144,f3722c,f8961e,f9c74f.svg
```

- 一番「パレット」に見える。人間には読みやすい。
- Slack / Discord / X / Markdown のオートリンクが `%2C` にエスケープすることがあり、canonical が汚れる。WAF がカンマを嫌うこともある。
- 「見た目が良い URL」が欲しいなら、表示用の短縮リンクとしてだけ使うのが安全。

### D. クエリのみ

```
/palette?c=f94144,f3722c&format=svg&w=1200&h=630
```

- ルーターが単純で、形式を `Accept` で切り替えられる。
- URL が画像に見えない。ホットリンク・OG・「右クリックで保存」と相性が悪い。canonical にはしない。

### E. ハイブリッド（実際の推奨）

```
canonical:  /{hex}-{hex}.svg
aliases:    /p/{hex}/{hex}.svg      → 301
            /{hex},{hex}.svg        → 301
            /%23ff3b30.svg          → 301 /ff3b30.svg
            /FF3B30.svg             → 200（リダイレクトしない。キャッシュを増やさない）
```

- 拡張子なし = HTML ページ、`.svg` = SVG、`.png` = PNG。
- 画像 URL をそのまま人に渡せる。ページ側の「画像 URL」コピーも同じ形。
- 301 は `Cache-Control: public, max-age=86400`。canonical は immutable。

## ルート一覧（最終形の提案）

| Path                    | Response                                |
| ----------------------- | --------------------------------------- |
| `/`                     | ランディング（作成 UI・例）             |
| `/{colors}`             | HTML ページ（プレビュー＋コピー＋埋込） |
| `/{colors}.svg`         | SVG                                     |
| `/{colors}.png`         | PNG（resvg-wasm。OG 用）                |
| `/{colors}.json`        | 色のメタデータ（rgb / hsl / contrast）  |
| `/random`               | ランダムパレットの HTML                 |
| `/random.svg`           | ランダムパレットの SVG                  |
| `/api/palette?colors=`  | JSON API（任意）                        |
| `/healthz`              | `200 ok`                                |

`/{colors}` の HTML は `/{colors}.png` を `og:image` に指定する。**SVG は OG 非対応のクローラが多い**ので、共有用は PNG が必須。

## クエリパラメータ

| Param       | Values                                              | Default              |
| ----------- | --------------------------------------------------- | -------------------- |
| `layout`    | `strip` `cards` `feature` `mosaic` `blobs` `scale`  | `strip`              |
| `w` / `h`   | 16–4096                                             | `1200` / `630`       |
| `labels`    | `hex` `none`                                        | `hex`                |
| `theme`     | `light` `dark`                                      | layout ごとに固定    |
| `title`     | 任意テキスト（80 文字まで、XML エスケープ）         | なし                 |
| `watermark` | `0` `1`                                             | `1`（URL を小さく）  |

`layout=scale` は 1 色のときだけ有効（複数色なら 400）。`layout` 省略時は常に `strip`。

サイズは縦横比でレイアウトを切り替えるのではなく、`viewBox` を固定して `preserveAspectRatio` で伸ばさない方が安全。正方形が欲しくなったら `w=h=1080` を渡し、レイアウト側で比率を見て調整する。

## エラー

- 不正な hex・色数超過・未知の layout → **400 + SVG のエラーカード**（`Cache-Control: no-store`）。
  JSON を返すより、埋め込んだ人が原因に気づきやすい。`title` に理由を出す。
- 未定義パス → 404（HTML）。

## キャッシュ

URL が内容を完全に決めるので:

```
Cache-Control: public, max-age=31536000, immutable
```

- クエリも含めてキーにする（Cloudflare の Cache API はクエリ込み）。
- PNG は生成コストがあるので Cache API に保存。`cf: { cacheEverything: true }` は使わず、Worker 内で明示的に。
- 301 は 1 日。`Vary: Accept` は拡張子で分けているので不要。

## セキュリティ

- SVG はスクリプトを実行できるので:
  - `Content-Type: image/svg+xml; charset=utf-8`
  - `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`
  - `X-Content-Type-Options: nosniff`
- `title` などユーザー入力は必ず XML エスケープ。
- `w`/`h` はクランプし、面積上限（例: 4MP）を設ける。

## 実装スタック

- **TS + Hono** を推奨。SVG は文字列連結なので Workers と相性が良く、`@resvg/resvg-wasm` で PNG も同じ Worker で出せる。
- Rust は `workers-rs` + `resvg` で可能だが、フォント（rustybuzz）と WASM のビルドが増える。速度が問題になる処理ではないので、Rust を使うなら「ジェネレータを WASM にして TS から呼ぶ」方が自由度が高い。
- Python Workers はエコシステムがまだ薄い。今回は不要。

### フォント

- SVG の `font-family` は環境依存。`system-ui` フォールバックだけだと OS ごとに字面が変わる。
- 配信 SVG に Inter（OFL）のサブセットを base64 で埋め込むと 15–25KB 増。キャッシュ前提なら許容。
- resvg は data URI の `@font-face` を読まないことがあるので、PNG 用にはフォントファイルを別途渡す。
- 文字幅は SVG にレイアウト機能がないため、`textLength` + `lengthAdjust="spacingAndGlyphs"` で収める（モックで実装済み）。

## HTML ページ（引用性）

- `/{colors}` にカラースウォッチ、HEX/RGB コピー、コントラスト比。
- CSS 変数 / Tailwind v4 `@theme` / JSON / Markdown 埋込のスニペット。
- `<link rel="canonical">` と OG（`og:image` は PNG、`twitter:card=summary_large_image`）。
- 「画像 URL」と「ページ URL」を別々にコピーできる。
- 画像内に小さく URL を入れておく（`watermark=1`）と、引用されたときに自然に戻ってくる。
- 関連パレット（色相が近い / ランダム）で回遊。

## 実装状況（v0）

- 実装済み: ハイフン + 拡張子、HTML、`layout` 6 種、ランダム、カンマ / `%23` の 301 正規化、エラー SVG。
- 未実装: PNG、`.json`、`w`/`h`、`theme`、`labels`、`title`、`/p/` エイリアス。

## 決めること

1. canonical は A で良いか（B/C はエイリアスで十分か）。
2. 拡張子なしを HTML にするか、`Accept` で画像も返すか。
3. ~~既定レイアウト~~ → `strip` 固定で決定。
4. ~~PNG を最初から出すか~~ → v0 は SVG + HTML のみ。PNG は次段階。
5. ~~透かし~~ → 各レイアウトに小さく URL を入れる（実装済み）。
