import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { randomPalette, parseColors, slugOf } from "./colors";
import { DEFAULT_LAYOUT, isLayout, renderErrorSvg, renderSvg } from "./layouts";
import { renderErrorPage, renderLanding, renderPalettePage } from "./views";

const app = new Hono();

const SECURITY_OPTIONS = {
  crossOriginResourcePolicy: "cross-origin",
  referrerPolicy: "strict-origin-when-cross-origin",
} as const;

const HTML_CSP = {
  defaultSrc: ["'self'"],
  imgSrc: ["'self'", "data:"],
  styleSrc: ["'unsafe-inline'"],
  scriptSrc: ["'unsafe-inline'"],
  baseUri: ["'none'"],
  formAction: ["'self'"],
};

const SVG_CSP = {
  defaultSrc: ["'none'"],
  styleSrc: ["'unsafe-inline'"],
};

const htmlSecurity = secureHeaders({
  ...SECURITY_OPTIONS,
  contentSecurityPolicy: HTML_CSP,
});

const svgSecurity = secureHeaders({
  ...SECURITY_OPTIONS,
  contentSecurityPolicy: SVG_CSP,
});

app.use((c, next) =>
  c.req.path.toLowerCase().endsWith(".svg") ? svgSecurity(c, next) : htmlSecurity(c, next),
);

const SVG_HEADERS = (immutable: boolean) => ({
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-store",
});

const HTML_HEADERS = (cache: "public" | "none" = "public") => ({
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": cache === "public" ? "public, max-age=300" : "no-store",
});

const svgError = (message: string, status = 400) =>
  new Response(renderErrorSvg(message), {
    status,
    headers: SVG_HEADERS(false),
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

app.get("/healthz", (c) => c.text("ok"));
app.get("/favicon.ico", (c) => c.body(null, 204));

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
    return c.redirect("/" + slugOf(parsed.colors), 302);
  }

  return c.html(renderLanding({ origin }), 200, HTML_HEADERS());
});

const noStoreRedirect = (location: string) =>
  new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
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

  if (isSvg) {
    return new Response(renderSvg(colors, layoutParam, { site }), {
      status: 200,
      headers: SVG_HEADERS(true),
    });
  }

  return c.html(renderPalettePage({ colors, layout: layoutParam, origin }), 200, HTML_HEADERS());
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
