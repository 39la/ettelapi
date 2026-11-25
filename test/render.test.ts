import { describe, expect, test } from "bun:test";
import { LAYOUTS, renderErrorSvg, renderSvg } from "../src/layouts";

const COLORS = ["#f94144", "#f3722c", "#f8961e", "#f9c74f", "#90be6d", "#577590"];

describe("renderSvg", () => {
  for (const layout of LAYOUTS) {
    test(`renders ${layout.id}`, () => {
      const colors = layout.id === "scale" ? ["#ff3b30"] : COLORS;
      const svg = renderSvg(colors, layout.id, { site: "ettelapi.example" });
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain('viewBox="0 0 1200 630"');
      expect(svg).toContain("<title>");
      for (const color of colors) expect(svg).toContain(color);
      expect(svg).not.toContain("<script");
    });
  }

  test("emits the site watermark", () => {
    const svg = renderSvg(["#ff3b30"], "strip", { site: "localhost:8787" });
    expect(svg).toContain("localhost:8787/FF3B30");
  });

  test("escapes the watermark", () => {
    const svg = renderSvg(["#ff3b30"], "strip", { site: "a&b" });
    expect(svg).toContain("a&amp;b");
  });

  test("refuses multi-color scale", () => {
    expect(() => renderSvg(COLORS.slice(0, 2), "scale", { site: "x" })).toThrow(/one color/);
  });

  test("renders a friendly error image", () => {
    const svg = renderErrorSvg('"nope" is not a hex color');
    expect(svg).toContain("400");
    expect(svg).toContain("nope");
    expect(svg.startsWith("<svg")).toBe(true);
  });
});
