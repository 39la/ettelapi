import { Hono } from "hono";
import { etag } from "hono/etag";
import { secureHeaders } from "hono/secure-headers";
import { randomPalette, parseColors, parseAccent, slugOf } from "./colors";
import { DEFAULT_LAYOUT, isLayout, renderErrorSvg, renderSvg } from "./layouts";
import { renderLlmsTxt } from "./llms";
import { parseSize } from "./size";
import { renderErrorPage, renderLanding, renderPalettePage } from "./views";

const app = new Hono();

const SECURITY_OPTIONS = {
  crossOriginResourcePolicy: "cross-origin",
  referrerPolicy: "strict-origin-when-cross-origin",
} as const;

const htmlSecurity = secureHeaders({
  ...SECURITY_OPTIONS,
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", "data:"],
    styleSrc: ["'unsafe-inline'"],
    scriptSrc: ["'unsafe-inline'"],
    baseUri: ["'none'"],
    formAction: ["'self'"],
  },
});

const svgSecurity = secureHeaders({
  ...SECURITY_OPTIONS,
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
    styleSrc: ["'unsafe-inline'"],
  },
});

app.use((c, next) =>
  c.req.path.toLowerCase().endsWith(".svg") ? svgSecurity(c, next) : htmlSecurity(c, next),
);

// Revalidate rather than promise a year of immutability: layouts and fonts change.
const CACHE_TTL_SECONDS = 300;
const PUBLIC_CACHE = `public, max-age=${CACHE_TTL_SECONDS}`;

app.use(etag({ weak: true }));

const SVG_HEADERS = (cache: "public" | "none" = "public") => ({
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": cache === "public" ? PUBLIC_CACHE : "no-store",
});

const HTML_HEADERS = (cache: "public" | "none" = "public") => ({
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": cache === "public" ? PUBLIC_CACHE : "no-store",
});

const svgError = (message: string, status = 400) =>
  new Response(renderErrorSvg(message), {
    status,
    headers: SVG_HEADERS("none"),
  });

const htmlError = (status: number, message: string) =>
  new Response(renderErrorPage(status, message), {
    status,
    headers: HTML_HEADERS("none"),
  });

const requestInfo = (url: string) => {
  const parsed = new URL(url);
  return { origin: parsed.origin, site: parsed.host, search: parsed.search };
};

const noStoreRedirect = (location: string) =>
  new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
  });

app.get("/healthz", (c) => c.text("ok"));
app.get("/favicon.ico", (c) => c.body(null, 204));
app.get("/llms.txt", (c) =>
  c.text(renderLlmsTxt(requestInfo(c.req.url).origin), 200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": PUBLIC_CACHE,
  }),
);

app.get("/", (c) => {
  const input = c.req.query("colors");
  const { origin } = requestInfo(c.req.url);

  if (input !== undefined && input.trim() !== "") {
    const parsed = parseColors(input);
    if (!parsed.ok) {
      return c.html(
        renderLanding({ origin, error: parsed.message, value: input }),
        400,
        HTML_HEADERS("none"),
      );
    }
    return noStoreRedirect("/" + slugOf(parsed.colors));
  }

  return c.html(renderLanding({ origin }), 200, HTML_HEADERS());
});

app.get("/random", () => noStoreRedirect("/" + slugOf(randomPalette())));

app.get("/random.svg", () => noStoreRedirect("/" + slugOf(randomPalette()) + ".svg"));

app.get("/:slug", (c) => {
  const raw = c.req.param("slug");
  const lower = raw.toLowerCase();
  const isSvg = lower.endsWith(".svg");
  const base = isSvg ? raw.slice(0, -4) : raw;
  const { origin, site, search } = requestInfo(c.req.url);

  // `.png` is deliberately not served yet: fail as a page, not a broken image.
  if (/\.(png|jpe?g|webp|json)$/i.test(raw)) {
    return htmlError(404, "That format is not available yet.");
  }

  // Tidy aliases: commas and a leading # get a 301 to the hyphen URL.
  if (base.includes(",") || base.includes("#")) {
    const alias = parseColors(base);
    if (alias.ok) {
      const target = `/${slugOf(alias.colors)}${isSvg ? ".svg" : ""}${search}`;
      return c.redirect(target, 301);
    }
  }

  const parsed = parseColors(base);
  if (!parsed.ok) {
    return isSvg ? svgError(parsed.message) : htmlError(400, parsed.message);
  }
  const colors = parsed.colors;

  const layoutParam = c.req.query("layout") ?? DEFAULT_LAYOUT;
  if (!isLayout(layoutParam)) {
    const message = `Unknown layout "${layoutParam}".`;
    return isSvg ? svgError(message) : htmlError(400, message);
  }
  if (layoutParam === "scale" && colors.length !== 1) {
    const message = "layout=scale only works with one color.";
    return isSvg ? svgError(message) : htmlError(400, message);
  }

  const accentRaw = c.req.query("accent");
  let accent: string | undefined;
  if (accentRaw !== undefined && accentRaw.trim() !== "") {
    if (colors.length !== 1) {
      const message = "accent only works with one color.";
      return isSvg ? svgError(message) : htmlError(400, message);
    }
    const parsedAccent = parseAccent(accentRaw);
    if (!parsedAccent.ok) {
      return isSvg ? svgError(parsedAccent.message) : htmlError(400, parsedAccent.message);
    }
    accent = parsedAccent.color;
  }

  const sizeResult = parseSize(c.req.query("w"), c.req.query("h"));
  if (!sizeResult.ok) {
    return isSvg ? svgError(sizeResult.message) : htmlError(400, sizeResult.message);
  }
  const { size } = sizeResult;

  if (isSvg) {
    return new Response(
      renderSvg(colors, layoutParam, { site, width: size.w, height: size.h, accent }),
      {
        status: 200,
        headers: SVG_HEADERS(),
      },
    );
  }

  return c.html(
    renderPalettePage({
      colors,
      layout: layoutParam,
      origin,
      width: size.w,
      height: size.h,
      accent,
    }),
    200,
    HTML_HEADERS(),
  );
});

app.notFound((c) => {
  if (c.req.path.toLowerCase().endsWith(".svg")) {
    return svgError("Not found.", 404);
  }
  return htmlError(404, "Page not found.");
});

app.onError((err, c) => {
  console.error(err);
  if (c.req.path.toLowerCase().endsWith(".svg")) {
    return svgError("Something went wrong.", 500);
  }
  return htmlError(500, "Something went wrong.");
});

export default app;
