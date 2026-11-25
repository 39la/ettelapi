import { describe, expect, test } from "bun:test";
import { MAX_AREA, MAX_SIZE, MIN_SIZE, parseSize } from "../src/size";

describe("parseSize", () => {
  test("defaults to 1200x630", () => {
    expect(parseSize()).toEqual({ ok: true, size: { w: 1200, h: 630 } });
    expect(parseSize("", "")).toEqual({ ok: true, size: { w: 1200, h: 630 } });
  });

  test("takes one or both sides", () => {
    expect(parseSize("1080", "1080")).toEqual({ ok: true, size: { w: 1080, h: 1080 } });
    expect(parseSize("1080", undefined)).toEqual({ ok: true, size: { w: 1080, h: 630 } });
  });

  test("rejects non-integers", () => {
    const bad = parseSize("wide", undefined);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message).toContain('"w"');
    expect(parseSize(undefined, "12.5").ok).toBe(false);
    expect(parseSize("-10", undefined).ok).toBe(false);
  });

  test("clamps to the allowed range", () => {
    expect(parseSize("99999", "1")).toEqual({
      ok: true,
      size: { w: MAX_SIZE, h: MIN_SIZE },
    });
  });

  test("keeps the area under the cap", () => {
    const result = parseSize("4096", "4096");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.size.w * result.size.h).toBeLessThanOrEqual(MAX_AREA);
      expect(Math.abs(result.size.w - result.size.h)).toBeLessThanOrEqual(1);
    }
  });
});
