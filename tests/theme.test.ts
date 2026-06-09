import { describe, it, expect } from "vitest";
import {
  PRIMARY_COLOR_PRESETS,
  ACCENT_PRESETS,
  BACKGROUND_TONES,
  RADIUS_OPTIONS,
} from "../client/src/contexts/themePresets";

const HSL_RE = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/;

describe("Theme Presets — Primary Colors", () => {
  it("should export at least 14 primary color presets", () => {
    expect(PRIMARY_COLOR_PRESETS.length).toBeGreaterThanOrEqual(14);
  });

  it("should have unique preset names", () => {
    const names = PRIMARY_COLOR_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("should include the default 'blue' preset", () => {
    expect(PRIMARY_COLOR_PRESETS.find((p) => p.name === "blue")).toBeDefined();
  });

  it("every preset should have label, primary, primaryForeground, ring", () => {
    for (const preset of PRIMARY_COLOR_PRESETS) {
      expect(preset.label).toBeTruthy();
      expect(preset.primary).toBeTruthy();
      expect(preset.primaryForeground).toBeTruthy();
      expect(preset.ring).toBeTruthy();
    }
  });

  it("every primary value should be a valid HSL triple", () => {
    for (const preset of PRIMARY_COLOR_PRESETS) {
      expect(preset.primary).toMatch(HSL_RE);
    }
  });

  it("every primaryForeground should be a valid HSL triple", () => {
    for (const preset of PRIMARY_COLOR_PRESETS) {
      expect(preset.primaryForeground).toMatch(HSL_RE);
    }
  });

  it("ring should equal primary for visual consistency", () => {
    for (const preset of PRIMARY_COLOR_PRESETS) {
      expect(preset.ring).toBe(preset.primary);
    }
  });
});

describe("Theme Presets — Accent Tones", () => {
  it("should export multiple accent tones", () => {
    expect(ACCENT_PRESETS.length).toBeGreaterThanOrEqual(7);
  });

  it("should include the 'auto' (Match Primary) option as the first entry", () => {
    expect(ACCENT_PRESETS[0].name).toBe("auto");
    expect(ACCENT_PRESETS[0].accent).toBe("");
  });

  it("non-auto accents should have valid HSL", () => {
    for (const preset of ACCENT_PRESETS.filter((p) => p.name !== "auto")) {
      expect(preset.accent).toMatch(HSL_RE);
      expect(preset.accentForeground).toMatch(HSL_RE);
    }
  });

  it("should have unique names", () => {
    const names = ACCENT_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("Theme Presets — Background Tones", () => {
  it("should export at least 6 background tones", () => {
    expect(BACKGROUND_TONES.length).toBeGreaterThanOrEqual(6);
  });

  it("should include the 'default' tone", () => {
    expect(BACKGROUND_TONES.find((b) => b.name === "default")).toBeDefined();
  });

  it("every tone should have light + dark variants in valid HSL", () => {
    for (const tone of BACKGROUND_TONES) {
      expect(tone.light).toMatch(HSL_RE);
      expect(tone.dark).toMatch(HSL_RE);
      expect(tone.label).toBeTruthy();
    }
  });

  it("dark variants should be visibly darker than light variants", () => {
    for (const tone of BACKGROUND_TONES) {
      const lightLightness = parseFloat(tone.light.split(" ")[2]);
      const darkLightness = parseFloat(tone.dark.split(" ")[2]);
      expect(darkLightness).toBeLessThan(lightLightness);
    }
  });
});

describe("Theme Presets — Radius Options", () => {
  it("should export 5 radius options", () => {
    expect(RADIUS_OPTIONS.length).toBe(5);
  });

  it("should include the default 'medium' radius", () => {
    expect(RADIUS_OPTIONS.find((r) => r.name === "medium")).toBeDefined();
  });

  it("radii should be in ascending order", () => {
    for (let i = 1; i < RADIUS_OPTIONS.length; i++) {
      expect(RADIUS_OPTIONS[i].rem).toBeGreaterThan(RADIUS_OPTIONS[i - 1].rem);
    }
  });

  it("first radius should be square (0)", () => {
    expect(RADIUS_OPTIONS[0].rem).toBe(0);
  });

  it("last radius should be at least 1.0rem (pill)", () => {
    expect(RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1].rem).toBeGreaterThanOrEqual(1.0);
  });

  it("every radius value should be non-negative", () => {
    for (const opt of RADIUS_OPTIONS) {
      expect(opt.rem).toBeGreaterThanOrEqual(0);
      expect(opt.label).toBeTruthy();
      expect(opt.name).toBeTruthy();
    }
  });
});

describe("Theme Presets — Cross-checks", () => {
  it("default appearance values referenced in code should exist in presets", () => {
    expect(PRIMARY_COLOR_PRESETS.find((p) => p.name === "blue")).toBeDefined();
    expect(ACCENT_PRESETS.find((p) => p.name === "auto")).toBeDefined();
    expect(BACKGROUND_TONES.find((b) => b.name === "default")).toBeDefined();
    expect(RADIUS_OPTIONS.find((r) => r.name === "medium")).toBeDefined();
  });

  it("all preset names should be lowercase, no whitespace", () => {
    const all = [
      ...PRIMARY_COLOR_PRESETS.map((p) => p.name),
      ...ACCENT_PRESETS.map((p) => p.name),
      ...BACKGROUND_TONES.map((b) => b.name),
      ...RADIUS_OPTIONS.map((r) => r.name),
    ];
    for (const n of all) {
      expect(n).toMatch(/^[a-z][a-z0-9]*$/);
    }
  });

  it("primary colors should span the hue spectrum (>= 8 distinct hues)", () => {
    const hues = new Set(PRIMARY_COLOR_PRESETS.map((p) => parseInt(p.primary.split(" ")[0], 10)));
    expect(hues.size).toBeGreaterThanOrEqual(8);
  });
});
