import { DEFAULT_LAYOUT, LAYOUTS } from "../layouts";
import { renderDocument } from "./document";
import { EXAMPLES, palettePath, SAMPLE } from "./shared";

export interface LandingOptions {
  origin: string;
  error?: string;
  value?: string;
}

export function renderLanding({ origin, error, value = "" }: LandingOptions): string {
  const sampleSlug = SAMPLE.map((c) => c.slice(1)).join("-");

  const examples = EXAMPLES.map(({ colors, label }) => (
    <a href={palettePath(colors, DEFAULT_LAYOUT, "")}>
      <i aria-hidden="true" style={`--gradient: linear-gradient(90deg, ${colors.join(", ")})`} />
      {label}
    </a>
  ));

  const layoutCards = LAYOUTS.map((layout) => {
    const colors = layout.id === "scale" ? ["#ff3b30"] : SAMPLE;
    return (
      <a class="layoutcard" href={palettePath(colors, layout.id, "")}>
        <img
          src={palettePath(colors, layout.id, ".svg")}
          alt={`${layout.name} layout`}
          loading="lazy"
          width="1200"
          height="630"
        />
        <div>
          <b>{layout.name}</b>
          <small>{layout.blurb}</small>
        </div>
      </a>
    );
  });

  return renderDocument({
    title: "palette — color palettes as images",
    description: "Put hex colors in the URL and get an SVG palette image plus a shareable page.",
    canonical: origin + "/",
    ogImage: origin + palettePath(SAMPLE, DEFAULT_LAYOUT, ".svg"),
    children: (
      <>
        <section class="hero-copy">
          <p class="kicker">
            <b>Color palettes as images</b>
            <span>·</span>
            <span>SVG + HTML</span>
          </p>
          <h1>
            Put colors
            <br />
            <span>in the URL.</span>
          </h1>
          <p class="lede">
            Type a few hex codes and get a palette image, a page, and copy-paste snippets. No export
            step, no accounts.
          </p>
          <form class="composer" method="get" action="/">
            <input
              name="colors"
              value={value}
              placeholder="#f94144, #f3722c, #f8961e"
              aria-label="Hex colors"
              autocomplete="off"
              spellcheck={false}
            />
            <button class="btn" type="submit">
              Open palette
            </button>
          </form>
          {error ? <p class="err">{error}</p> : null}
          <div class="examples" id="examples">
            <span>Try:</span>
            {examples}
            <a href="/random">Random</a>
          </div>
        </section>

        <section class="section" id="layouts">
          <h2>Six ways to show a palette</h2>
          <p class="sub">
            Switch with <code>?layout=</code> on any palette. Bands is the default.
          </p>
          <div class="layoutgrid">{layoutCards}</div>
        </section>

        <section class="section" id="url">
          <h2>One URL, two faces</h2>
          <p class="sub">Same colors, different extension.</p>
          <div class="twocards">
            <div class="panel">
              <h3>Image</h3>
              <code>{"/{colors}.svg"}</code>
              <p>
                1200 × 630 SVG. Cache-friendly and infinitely sharp. Append{" "}
                <code>?layout=cards</code> for a different design.
              </p>
            </div>
            <div class="panel">
              <h3>Page</h3>
              <code>{"/{colors}"}</code>
              <p>Swatches, RGB values, CSS variables, Tailwind theme, and embed snippets.</p>
            </div>
          </div>
          <p class="hint">
            Colors are 3 or 6 hex digits joined with hyphens, up to 12. Example:{" "}
            <a href={`/${sampleSlug}`}>
              <code>/{sampleSlug}</code>
            </a>
          </p>
        </section>
      </>
    ),
  });
}
