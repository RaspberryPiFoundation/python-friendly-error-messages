import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadCopydeckFor } from "../src/loaders";
import { explain, loadCopydeck, registerAdapter } from "../src/engine";
import { skulptAdapter } from "../src/adapters/skulpt";

const makeRes = (ok: boolean, data?: any) =>
  new Response(ok ? JSON.stringify(data) : "not found", { status: ok ? 200 : 404 });

const minimalDeck = {
  meta: { language: "en", version: 1 },
  errors: { Other: { variants: [{ title: "Python error", summary: "Look at the last line." }] } }
};

describe("loadCopydeckFor", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it("loads exact locale first, then falls back to base", async () => {
    // first try (en-GB) 404, then base (en) 200
    (globalThis.fetch as any)
      .mockResolvedValueOnce(makeRes(false)) // /copydecks/en-GB/copydeck.json
      .mockResolvedValueOnce(makeRes(true, minimalDeck)); // /copydecks/en/copydeck.json

    await loadCopydeckFor("en-GB");
    registerAdapter("skulpt", skulptAdapter);

    const res = explain({ error: "TypeError: bad", code: "" });
    expect(res.title).toBe("Python error");
    expect((globalThis.fetch as any).mock.calls[0][0]).toMatch(/copydecks\/en-GB\/copydeck\.json/);
    expect((globalThis.fetch as any).mock.calls[1][0]).toMatch(/copydecks\/en\/copydeck\.json/);
  });

  it("throws if no deck is found after fallbacks", async () => {
    (globalThis.fetch as any)
      .mockResolvedValue(makeRes(false)); // all attempts fail

    await expect(loadCopydeckFor("xx-YY")).rejects.toThrow(/No copydeck found/i);
  });

  it("still supports manual loadCopydeck for tests without fetch", () => {
    loadCopydeck(minimalDeck as any);
    registerAdapter("skulpt", skulptAdapter);
    const res = explain({ error: "NameError: name 'x' is not defined", code: "" });
    expect(res.title).toBe("Python error");
  });
});
