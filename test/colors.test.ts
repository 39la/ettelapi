import { describe, expect, test } from "bun:test";
import {
  accentInk,
  contrastColor,
  contrastRatio,
  inkFor,
  labelOf,
  MAX_COLORS,
  mix,
  normalizeHex,
  parseAccent,
  parseColors,
  randomPalette,
  rgbOf,
  slugOf,
} from "../src/colors";

describe("parseColors", () => {
  test("accepts hyphen separated colors", () => {
    const result = parseColors("f94144-f3722c");
    expect(result).toEqual({ ok: true, colors: ["#f94144", "#f3722c"] });
  });

  test("accepts commas as an alias", () => {
    const result = parseColors("f94144, F3722C");
    expect(result).toEqual({ ok: true, colors: ["#f94144", "#f3722c"] });
  });

  test("expands 3-digit hex and strips #", () => {
    const result = parseColors("#f00-0F0");
    expect(result).toEqual({ ok: true, colors: ["#ff0000", "#00ff00"] });
  });

  test("rejects 8-digit hex and non-hex", () => {
    expect(parseColors("ff000080").ok).toBe(false);
    expect(parseColors("red").ok).toBe(false);
    expect(parseColors("ff3b3").ok).toBe(false);
  });

  test("rejects empty input and double separators", () => {
    expect(parseColors("").ok).toBe(false);
    expect(parseColors("-").ok).toBe(false);
    expect(parseColors("ff3b30--00ff00").ok).toBe(false);
  });

  test(`caps palettes at ${MAX_COLORS} colors`, () => {
    const twelve = Array.from({ length: 12 }, () => "ff3b30").join("-");
    const thirteen = twelve + "-00ff00";
    expect(parseColors(twelve).ok).toBe(true);
    expect(parseColors(thirteen).ok).toBe(false);
  });
});

describe("color helpers", () => {
  test("normalizes hex", () => {
    expect(normalizeHex("f00")).toBe("#ff0000");
    expect(normalizeHex("#AbCdEf")).toBe("#abcdef");
  });

  test("slug and label", () => {
    expect(labelOf("#f94144")).toBe("F94144");
    expect(slugOf(["#f94144", "#f3722c"])).toBe("f94144-f3722c");
  });

  test("rgb and mix", () => {
    expect(rgbOf("#f94144")).toEqual([249, 65, 68]);
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  test("picks a readable text color", () => {
    expect(contrastColor("#ffffff")).toBe("#111111");
    expect(contrastColor("#000000")).toBe("#ffffff");
    expect(contrastColor("#f94144")).toBe("#111111");
    expect(contrastColor("#577590")).toBe("#ffffff");
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  test("random palettes are valid", () => {
    const colors = randomPalette(5);
    expect(colors).toHaveLength(5);
    for (const c of colors) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("accent", () => {
  test("parseAccent accepts 3/6 digits and a leading #", () => {
    expect(parseAccent("0f0")).toEqual({ ok: true, color: "#00ff00" });
    expect(parseAccent("#FF3B30")).toEqual({ ok: true, color: "#ff3b30" });
  });

  test("parseAccent rejects junk and lists", () => {
    expect(parseAccent("nope").ok).toBe(false);
    expect(parseAccent("ff3b30-00ff00").ok).toBe(false);
    expect(parseAccent("").ok).toBe(false);
  });

  test("accentInk stays tinted and readable", () => {
    const onPaper = accentInk("#F4F3EF", "#ff3b30");
    expect(onPaper).not.toBe("#111111");
    expect(contrastRatio(onPaper, "#F4F3EF")).toBeGreaterThan(4.5);

    const onDark = accentInk("#101012", "#ff3b30");
    expect(onDark).not.toBe("#ffffff");
    expect(contrastRatio(onDark, "#101012")).toBeGreaterThan(4.5);
  });

  test("inkFor keeps black/white for multiple colors", () => {
    const ink = inkFor(["#ff3b30", "#00ff00"]);
    expect(ink("#F4F3EF")).toBe("#111111");
    expect(ink("#101012")).toBe("#ffffff");
  });

  test("inkFor tints single-color palettes", () => {
    expect(inkFor(["#1d4ed8"])("#F4F3EF")).not.toBe("#111111");
    expect(inkFor(["#ff3b30"])("#F4F3EF")).not.toBe("#111111");
  });
});
