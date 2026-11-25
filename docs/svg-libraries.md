# SVG 構築ライブラリの検討

移行前の `src/layouts/*.ts` は、`text()` ヘルパー + 文字列連結で SVG を組み立てていた。これを「読みやすく・保守しやすく」するためのライブラリを、Workers 適合性・バンドルサイズ・エスケープ・型・実測速度で比較した。

結論を先に:

- **Hono JSX を採用**（2026-11-25 に移行済み。実装は `src/layouts/*.tsx` + `components.tsx`）。新規依存ゼロで、`src/views/*.tsx` と同じランタイムをレイアウトにも広げた。エスケープとコンポーネント化が手に入り、バンドルの増分はほぼ 0。
- 型安全を最優先するなら **Preact + preact-render-to-string**（+約 8.6 KB gzip、JSX ランタイムが 2 つになる）。
- 書き換えを最小にしたいだけなら **`hono/html` のタグ付きテンプレート**（+約 0.9 KB gzip）。
- `@svgdotjs/svg.js` / `xmlbuilder2` / `satori` / `linkedom` はこの用途では不採用。理由は下記。

## 移行前のコードと課題

```ts
// src/layouts/cards.ts（抜粋）
g += `<rect x="${round(x)}" y="${round(top)}" width="${round(cw)}" height="${round(
  cardH,
)}" rx="${round(16 * u)}" fill="${c}"/>`;
g += text({
  x: x + 14 * u,
  y: top + 26 * u,
  s: String(i + 1).padStart(2, "0"),
  fs: 11 * u,
  fill: fg,
  ls: 1.5 * u,
  opacity: 0.5,
});
```

- 文字列連結なので条件分岐が `+=` の積み重ねになり、要素のまとまり（カード 1 枚、ヘッダー、フッター）がコード上で見えない。
- エスケープは `text()` と `esc()` を**呼び忘れると終わり**。属性値は現在ほぼ内部生成値だが、`site`（Host ヘッダー由来）だけは外部入力。
- 属性名のタイポを誰も止めない。`letter-spacing` を `letter-spacng` にしても型エラーにならず、静かに消える。
- 一方で速かった（移行前の実測 8–27 µs/レイアウト、後述）し、依存もゼロ。**この速度とゼロ依存は捨てなくてよい**、というのが以下の前提。

## 評価軸

1. workerd（`cf` CLI、`nodejs_compat` なし）で動くか
2. 追加バンドル（gzip）と依存数
3. テキスト・属性のエスケープがデフォルトか
4. SVG 属性の型が効くか
5. 6 レイアウト / 約 500 行に分割したときの読み味
6. 将来の PNG（`@resvg/resvg-wasm`）と矛盾しないか

## 比較表

バンドルは各ライブラリの代表的 API + 同一の 25 要素 SVG を描く 12 行を esbuild（minify, browser, es2022）+ gzip -9 で測った**実測値**。Hono は本体が既にバンドル済みなので、このリポジトリでの増分はこれより小さい。

| ライブラリ | 版 (2026-11-25) | 追加 gzip | Workers | エスケープ | 属性型 | 読み味・備考 |
| --- | --- | ---: | --- | --- | --- | --- |
| **Hono JSX** (`hono/jsx`) | 4.13.22 | **6.1 KB**（既存のため実質 0） | ✅ | 自動 | ✗（`[tag: string]`） | 既存の views と同じ書き味。コンポーネント化向き |
| **`hono/html`** | 同上 | **0.9 KB** | ✅ | 自動 | ✗ | 文字列のまま。`+` がテンプレートになるだけ |
| **Preact + render-to-string** | 11.2.0 / 6.8.3 | **8.6 KB** | ✅ | 自動 | ✅ 本物の SVG 型 | 型は最強。JSX ランタイムが 2 つになる |
| **@thi.ng/hiccup-svg + hiccup** | 5.6.23 / 5.4.14 | **8.5 KB** | ✅ | 任意（`escape: true` 必須） | ✗ | 配列データなのでテストしやすい。ややニッチ |
| **svgson** | 5.3.1 (2023) | 5.2 KB | ✅ | するがテキストを CDATA 化 | ✗ | AST 構築が冗長。更新停止気味 |
| **xmlbuilder2** | 4.0.3 | 84.0 KB | ⚠️ `events` | 自動 | ✗ | DOM を同梱。`nodejs_compat` が要る |
| **@svgdotjs/svg.js** (+svgdom) | 3.2.8 | 29.9 KB（本体のみ） | ❌ DOM 必須 | する | 一部 | workerd で `document` が無く失敗 |
| **svg-builder** | 3.0.4 | 5.7 KB | ✅ | **しない** | 実行時のみ | 属性名は検証するがエスケープ皆無 |
| **linkedom** | 0.18.15 | 141.7 KB | ✅ | 属性はしない | ✗ | 用途違い。属性エスケープに不具合 |
| **satori** | 0.63.2 | 685 KB | ⚠️ フォント/WASM | テキストはパス化 | — | HTML/CSS→SVG。別レイヤーの道具 |
| `@resvg/resvg-wasm` | 2.6.2 | 1.7 KB + 2.42 MB wasm | ✅ | — | — | SVG→PNG。構築側とは独立 |

## パフォーマンス実測

同一の 25 要素（背景 + ヘッダー + 6 カード + ラベル + フッター）を各 API で生成し、5 ラウンド × 5 プロセスの中央値。Bun 1.3.14 / macOS arm64。ホストの load average が 9–14 と高負荷だったため絶対値は保守的（2 回目のバッチでも順位は同一）。

| 手法 | ops/sec | µs/op | p95 µs | 出力 bytes | 相対 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 手書き文字列連結（現行相当） | 631,146 | **1.58** | 2.4 | 2,707 | 1× |
| @thi.ng/hiccup-svg | 37,345 | 26.8 | 34.8 | 2,885 | 17× 遅い |
| preact-render-to-string | 25,882 | 38.6 | 49.9 | 2,755 | 24× 遅い |
| svgson | 25,388 | 39.4 | 45.8 | 2,715 | 25× 遅い |
| **Hono JSX** | 21,606 | **46.3** | 85.7 | 2,755 | **29× 遅い** |
| xmlbuilder2 | 6,316 | 158.3 | 303.1 | 2,707 | 100× 遅い |
| svg.js + svgdom | 699 | 1,430 | 2,615 | 3,346 | 900× 遅い |

補足:

- Hono の `hono/jsx/dom/server` の `renderToString()` は 59.3 µs/op・gzip 12.4 KB で、`hono/jsx` + `.toString()` に対する速度利点なし。**DOM 版は使わない**。
- 全 7 手法の出力を workerd（wrangler dev）で実行し、Bun の出力と SHA-256 が一致することを確認済み（`nodejs_compat` なし）。
- 出力はどれも意味的に等価。xmlbuilder2 だけが現行とバイト一致、Hono/Preact は `<rect></rect>` になる（+6 bytes/要素、gzip 後は無視できる）。
- 実レイアウトの移行前後をこのリポジトリで測った（Bun、20k 回 × 5 ラウンド中央値）:

  | レイアウト | 移行前（文字列） | 移行後（Hono JSX） |
  | --- | ---: | ---: |
  | strip | 8.2 µs | 72.5 µs |
  | cards | 14.2 µs | 70.2 µs |
  | feature | 11.5 µs | 63.0 µs |
  | mosaic | 10.8 µs | 76.9 µs |
  | blobs | 10.9 µs | 84.6 µs |
  | scale | 27.5 µs | 91.5 µs |

  移行後は **63–91 µs/op**。上のマイクロベンチ（25 要素）の倍率 29× より小さく、**最大でも 0.1 ms 未満**。Free の 10 ms CPU に対して余裕がある。差が縮むのは、6 レイアウトが `fit` / `contrastColor` / `mix` の座標・色計算に時間を使っており、文字列連結の割合が相対的に小さいため。
- SVG は `Cache-Control: immutable`。ヒット時はレンダリング自体が走らないので、この差が効くのはコールド時だけ。

## コードイメージ

### 1. Hono JSX（推奨）

共通部品を `src/layouts/components.tsx` に置き、各レイアウトは「デザインの関数」になる。

```tsx
// src/layouts/components.tsx
import type { Child } from "hono/jsx";
import { type Canvas, MONO, round } from "./shared";

export interface FrameProps {
  canvas: Canvas;
  title: string;
  bg?: string;
  children: Child;
}

/** The SVG root. Owns the viewBox, title, aria label, and optional background. */
export const Frame = ({ canvas: { w, h }, title, bg, children }: FrameProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={w}
    height={h}
    viewBox={`0 0 ${w} ${h}`}
    role="img"
    aria-label={title}
  >
    <title>{title}</title>
    {bg ? <rect width={w} height={h} fill={bg} /> : null}
    {children}
  </svg>
);

export interface LabelProps {
  x: number;
  y: number;
  fs: number;
  fill: string;
  anchor?: "start" | "middle" | "end";
  family?: string;
  weight?: number;
  ls?: number;
  opacity?: number;
  children: Child;
}

/** `<text>` with the defaults the layouts share, plus rounding. */
export const Label = ({
  x,
  y,
  fs,
  fill,
  anchor,
  family = MONO,
  weight,
  ls = 0,
  opacity,
  children,
}: LabelProps) => (
  <text
    x={round(x)}
    y={round(y)}
    font-family={family}
    font-size={round(fs)}
    font-weight={weight}
    fill={fill}
    text-anchor={anchor}
    letter-spacing={ls ? round(ls) : undefined}
    opacity={opacity}
  >
    {children}
  </text>
);
```

```tsx
// src/layouts/cards.tsx（抜粋。n=1 / 縦長の分岐は現行どおり）
import { contrastColor, labelOf, slugOf } from "../colors";
import { Frame, Label } from "./components";
import { type Canvas, scaleOf, titleFor } from "./shared";

const Card = ({ color, index, x, y, w, h, u }: {
  color: string; index: number; x: number; y: number; w: number; h: number; u: number;
}) => {
  const fg = contrastColor(color);
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={16 * u} fill={color} />
      <Label x={x + 14 * u} y={y + 26 * u} fs={11 * u} fill={fg} opacity={0.5}>
        {String(index + 1).padStart(2, "0")}
      </Label>
      <Label x={x + w / 2} y={y + h + 30 * u} fs={15 * u} fill="#111" opacity={0.6} anchor="middle">
        {labelOf(color)}
      </Label>
    </>
  );
};

export function cards(colors: string[], site: string, canvas: Canvas): string {
  const { w, h } = canvas;
  const n = colors.length;
  const u = scaleOf(canvas);
  const pad = 56 * u;
  const gap = 18 * u;
  const top = 112 * u;
  const cw = (w - pad * 2 - gap * (n - 1)) / n;
  const cardH = h - pad - top - 48 * u;

  return String(
    <Frame canvas={canvas} title={titleFor(colors)} bg="#F4F3EF">
      <rect x={pad} y={72 * u} width={6 * u} height={6 * u} rx={u} fill="#111" opacity={0.8} />
      <Label x={pad + 16 * u} y={80 * u} fs={13 * u} fill="#111">PALETTE</Label>
      <Label x={w - pad} y={80 * u} fs={12 * u} fill="#111" opacity={0.45} anchor="end">
        {`${n} ${n === 1 ? "COLOR" : "COLORS"}`}
      </Label>
      {colors.map((c, i) => (
        <Card key={i} color={c} index={i} x={pad + i * (cw + gap)} y={top} w={cw} h={cardH} u={u} />
      ))}
      <Label x={w - pad} y={h - 16 * u} fs={11 * u} fill="#111" opacity={0.35} anchor="end">
        {`${site}/${slugOf(colors)}`}
      </Label>
    </Frame>,
  );
}
```

- `String(vnode)` で同期レンダリング。`hono/jsx/dom/server` の `renderToString` は不要（バンドルが 2 倍になる）。
- エスケープはテキスト・属性とも自動（`A"B<C&D` → `A&quot;B&lt;C&amp;D` を確認済み）。
- 型の注意: Hono の `IntrinsicElements` は `[tagName: string]: Props` なので **SVG 属性のタイポは通る**。属性は `kebab-case` で書く（`font-size`）。気になるなら後述の Preact。
- Hono JSX は属性内の `'` を `&#39;` にエスケープする。`font-family` は引用符を外した識別子列（`ui-monospace, SF Mono, Menlo, monospace`）にすると出力が短くきれいになる。

### 2. Preact（型を最優先する場合）

同じコンポーネントをほぼコピーでき、`viewBox={123}` や `<rectt>` を `tsc` が止める。

```tsx
/** @jsxImportSource preact */
import { renderToString } from "preact-render-to-string";

export const card = (hex: string) =>
  renderToString(
    <svg xmlns="http://www.w3.org/2000/svg" width={1200} height={630} viewBox="0 0 1200 630">
      <rect width={1200} height={630} fill="#F4F3EF" />
      <rect x={56} y={112} width={180} height={414} rx={16} fill={hex} />
    </svg>,
  );
```

`tsconfig.json` は `jsxImportSource: "hono/jsx"` なので、Preact 側はファイルごとに `/** @jsxImportSource preact */` が必要。付け忘れると `renderToString` が空文字を返す（無言で失敗する）ので注意。

### 3. `hono/html`（最小差分）

構造は変えず、手動 `esc()` と `+` だけを置き換える。

```ts
import { html } from "hono/html";

const rect = (c: string, x: number) =>
  html`<rect x="${x}" y="0" width="${1200 / 6}" height="630" fill="${c}" />`;

const body = html`${colors.map((c, i) => rect(c, i * 200))}`;
const svg = html`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">${body}</svg>`;
return String(svg);
```

補間値は自動でエスケープされる。コンポーネント共有はできないので、6 レイアウトの重複は残る。

### 4. `@thi.ng/hiccup-svg`（データ指向）

レイアウトを「配列の木」として返すので、ジオメトリをテストで直接検証できる。

```ts
import { serialize } from "@thi.ng/hiccup";
import { rect, svg, text } from "@thi.ng/hiccup-svg";

const tree = svg(
  { width: 1200, height: 630, viewBox: "0 0 1200 630" },
  rect([0, 0], 1200, 630, { fill: "#F4F3EF" }),
  ...colors.map((c, i) => rect([56 + i * 200, 112], 180, 414, { fill: c, rx: 16 })),
);
// escape はデフォルト off。必ず付ける
const markup = serialize(tree, { xml: true, escape: true });
```

## 各ライブラリの判定

- **Hono JSX**: 既に依存・既に `views` で使用。追加コストほぼ 0 で、エスケープと部品化が手に入る。欠点は SVG 属性の型だけ。**第一候補**。
- **preact + preact-render-to-string**: 唯一 SVG 属性を本気で型付けする（`viewBox={123}` を検出）。+8 KB gzip と 2 つ目の JSX ランタイムが代償。型を重視するなら本命。
- **hono/html**: 0.9 KB でエスケープだけ解決。大規模な書き換えをしたくない時の現実解。
- **hiccup-svg**: 純関数 + 配列で最もテストしやすい。ただし `escape: true` を忘れると不正 XML になるのと、`version` / `xmlns:inkscape` を勝手に足す。データ志向ならあり。
- **svgson**: テキストを CDATA にするため、HTML にインライン埋め込みすると壊れる。更新も 2023 年で停止。テスト用のパーサとしては有用。
- **xmlbuilder2**: 正しい XML を出すが `events` 依存で `nodejs_compat` が要り、84 KB gzip、100 倍遅い。`ele(name, attrs, text)` の第 3 引数が黙って落ちる罠もある。
- **svg.js**: `document` 必須。`svgdom` を足しても workerd では `createElementNS` で落ち、色を小文字化し、`<tspan>` を注入する。**不採用**。
- **satori**: 「SVG を組み立てる」道具ではなく「HTML/CSS をレイアウトして SVG/PNG を出す」道具。既存の 6 レイアウトは `<rect>` 座標なので、採用するなら全部 CSS で書き直し。685 KB gzip。**PNG/OG の別トラック**として温存。
- **linkedom**: 450 KB の DOM を積んで属性エスケープに不具合。論外。
- **svg-builder**: API は現行に一番近いが、エスケープを一切しない。採用すると `esc()` を自前で巻き続けることになり、現状より悪化。

## PNG（OG 画像）との関係

`@resvg/resvg-wasm` は SVG 文字列を受け取るだけなので、**どの構築手法とも組み合わせられる**。PNG 化で追加で必要なのは (a) `.wasm` の module ルール、(b) `<text>` を描くためのフォント同梱、の 2 点で、ビルダー選択とは独立。したがって「PNG のためだけに satori を選ぶ」必要はなく、Hono JSX で作った SVG をそのまま resvg に渡せる。satori を選ぶと 6 レイアウトを CSS で二重管理することになるので、この用途では不利。

## 移行の実際（実施済み）

1. `src/layouts/components.tsx` を追加。`Frame`（svg ルート、viewBox、title、背景）と `Label`（`<text>` の既定値 + 丸め）の 2 つだけ。
2. 6 レイアウトを `.tsx` 化。文字列の `+=` は JSX の要素列になり、カードや行はローカルコンポーネント（`ChipRow` など）にまとめた。
3. `text()` / `doc()` / `esc()` を削除。`src/escape.ts` も不要になったので削除した。
4. 出力検証: 1200×630 / 1080×1080 / 1080×1350 / 1920×1080 の 14 ケースを resvg で PNG 化し、**移行前とピクセル単位で一致**することを確認（`cmp` で 14/14 identical）。`cf dev`（workerd）経由のレスポンスも同じ描画になることを確認済み。
5. テストは 44 件すべて通過。`bun run check`（型・lint・format・test）も緑。

出力バイト数は約 1% 増（`<rect></rect>` と、フォントスタック中の `'` が `&#39;` になるため）。レンダリング時間は 4–8 倍になったが、絶対値は 0.1 ms 未満。属性タイポが実際に問題になったら、レイアウト層だけ Preact に差し替えられる（コンポーネント構造はそのまま移せる）。

## 参考

- Hono JSX: https://hono.dev/docs/guides/jsx
- Preact render-to-string: https://github.com/preactjs/preact-render-to-string
- @thi.ng/hiccup-svg: https://codeberg.org/thi.ng/umbrella/src/branch/develop/packages/hiccup-svg
- svgson: https://github.com/elrumordelaluz/svgson
- xmlbuilder2: https://github.com/oozcitak/xmlbuilder2
- satori: https://github.com/vercel/satori
- @resvg/resvg-wasm: https://github.com/yisibl/resvg-js
- 実測スクリプト・生成物: `/tmp/svgbench`、`/tmp/svg-survey`（リポジトリ外）
