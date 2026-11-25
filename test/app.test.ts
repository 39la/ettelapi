import { describe, expect, test } from "bun:test";
import app from "../src/index";

const get = (path: string) => app.request(path);

describe("image route", () => {
  test("returns an SVG with cache and security headers", async () => {
    const res = await get("/f94144-f3722c.svg");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("cross-origin-resource-policy")).toBe("cross-origin");
    expect(res.headers.get("content-security-policy")).toBe(
      "default-src 'none'; style-src 'unsafe-inline'",
    );
    const body = await res.text();
    expect(body).toContain('fill="#f94144"');
    expect(body).toContain('fill="#f3722c"');
  });

  test("defaults to bands", async () => {
    const plain = await (await get("/ff3b30.svg")).text();
    const explicit = await (await get("/ff3b30.svg?layout=strip")).text();
    expect(plain).toBe(explicit);
    expect(plain).toContain("ETTELAPI / 01");
  });

  test("honours layout=cards", async () => {
    const body = await (await get("/ff3b30.svg?layout=cards")).text();
    expect(body.toLowerCase()).toContain("#f4f3ef");
    expect(body).toContain("#ff3b30");
  });

  test("scale works for one color only", async () => {
    expect((await get("/ff3b30.svg?layout=scale")).status).toBe(200);
    const res = await get("/ff3b30-00ff00.svg?layout=scale");
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("only works with one color");
  });

  test("rejects invalid colors and layouts", async () => {
    const badColor = await get("/nope.svg");
    expect(badColor.status).toBe(400);
    expect(badColor.headers.get("cache-control")).toBe("no-store");

    const badLayout = await get("/ff3b30.svg?layout=nope");
    expect(badLayout.status).toBe(400);
    expect(await badLayout.text()).toContain("Unknown layout");
  });

  test("301s comma and hash aliases", async () => {
    const comma = await get("/f94144,f3722c.svg?layout=cards");
    expect(comma.status).toBe(301);
    expect(comma.headers.get("location")).toBe("/f94144-f3722c.svg?layout=cards");

    const hash = await get("/%23ff3b30");
    expect(hash.status).toBe(301);
    expect(hash.headers.get("location")).toBe("/ff3b30");
  });
});

describe("page route", () => {
  test("renders the palette page", async () => {
    const res = await get("/f94144-f3722c?layout=cards");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const body = await res.text();
    expect(res.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(res.headers.get("content-security-policy")).toContain("img-src 'self' data:");
    expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(body).toContain("2-color palette");
    expect(body).toContain("Cards");
    expect(body).toContain("data-copy=");
    expect(body).toContain("og:image");
    expect(body).toContain("canonical");
    expect(body).toContain("/f94144-f3722c.svg?layout=cards");
  });

  test("lands on the form page", async () => {
    const res = await get("/");
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body.startsWith("<!doctype html>")).toBe(true);
    expect(body).toContain("Put colors");
    expect(body).toContain('method="get"');
    expect(body).toContain('src="/f94144-f3722c-f8961e-f9c74f-90be6d-577590.svg?layout=cards"');
  });

  test("escapes user input in HTML", async () => {
    const res = await get("/?colors=%3Cscript%3Ealert(1)%3C/script%3E");
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain("&lt;script&gt;");
    expect(body).not.toContain("<script>alert");
  });

  test("redirects a valid composer submission", async () => {
    const res = await get("/?colors=%23ff3b30%2C%20%2300ff00");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/ff3b30-00ff00");
  });

  test("shows form errors instead of redirecting", async () => {
    const res = await get("/?colors=notacolor");
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("not a hex color");
  });

  test("random redirects to a palette", async () => {
    const res = await get("/random");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/^\/[0-9a-f]{6}-/);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  test("unknown paths and formats", async () => {
    const missing = await get("/a/b");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("content-type")).toContain("text/html");

    const missingSvg = await get("/a/b.svg");
    expect(missingSvg.status).toBe(404);
    expect(missingSvg.headers.get("content-type")).toContain("image/svg+xml");
    expect(missingSvg.headers.get("content-security-policy")).toContain("default-src 'none'");

    const png = await get("/ff3b30.png");
    expect(png.status).toBe(404);
  });
});

describe("size parameters", () => {
  test("renders the requested size", async () => {
    const res = await get("/f94144-f3722c.svg?w=1080&h=1080");
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('width="1080" height="1080" viewBox="0 0 1080 1080"');
    expect(body).toContain('fill="#f94144"');
  });

  test("adapts tall frames", async () => {
    const wide = await (await get("/f94144-f3722c.svg")).text();
    const tall = await (await get("/f94144-f3722c.svg?w=800&h=1200")).text();
    expect(tall).toContain('viewBox="0 0 800 1200"');
    expect(tall).not.toBe(wide);
  });

  test("rejects non-numeric sizes", async () => {
    const res = await get("/ff3b30.svg?w=wide");
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("whole number");
  });

  test("page links keep the size", async () => {
    const res = await get("/f94144-f3722c?w=1080&h=1080&layout=cards");
    const body = await res.text();
    expect(body).toContain("/f94144-f3722c.svg?layout=cards&amp;w=1080&amp;h=1080");
    expect(body).toContain("1080 × 1080");
    expect(body).toContain('property="og:image:width" content="1080"');
  });
});

describe("llms.txt", () => {
  test("describes the service", async () => {
    const res = await get("/llms.txt");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    const body = await res.text();
    expect(body).toContain("# ettelapi");
    expect(body).toContain("/{colors}.svg");
    expect(body).toContain("http://localhost/llms.txt");
    expect(body).toContain("layout");
  });
});

describe("accent color", () => {
  test("accepts an accent for one color", async () => {
    const plain = await (await get("/ff3b30.svg?layout=cards")).text();
    const tinted = await (await get("/ff3b30.svg?layout=cards&accent=00ff00")).text();
    expect(tinted).not.toBe(plain);
    expect(tinted).toContain("#008c00");
  });

  test("rejects accent for multiple colors and bad hex", async () => {
    const multi = await get("/ff3b30-00ff00.svg?accent=00ff00");
    expect(multi.status).toBe(400);
    expect(await multi.text()).toContain("only works with one color");

    const bad = await get("/ff3b30.svg?accent=nope");
    expect(bad.status).toBe(400);
    expect(await bad.text()).toContain("not a hex color");
  });

  test("page links keep the accent", async () => {
    const res = await get("/ff3b30?layout=cards&accent=00ff00");
    const body = await res.text();
    expect(body).toContain("/ff3b30.svg?layout=cards&amp;accent=00ff00");
    expect(body).toContain("Accent");
    expect(body).toContain("#00ff00");
  });
});
