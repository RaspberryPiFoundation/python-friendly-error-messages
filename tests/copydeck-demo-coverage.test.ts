import { describe, it, expect, beforeAll } from "vitest";
import { friendlyExplain, loadCopydeck, registerAdapter } from "../src/engine";
import { skulptAdapter } from "../src/adapters/skulpt";
import { pyodideAdapter } from "../src/adapters/pyodide";
import copydeck from "../copydecks/en/copydeck.json";
import { examples } from "../docs/demo-examples.js";

type DemoExample = {
  title: string;
  runtime: "skulpt" | "pyodide";
  code: string;
  trace: string;
  expectedVariantId: string;
};

const adaptersByRuntime = {
  skulpt: skulptAdapter,
  pyodide: pyodideAdapter,
};

describe("copydeck/demo coverage", () => {
  beforeAll(() => {
    loadCopydeck(copydeck as any);
    registerAdapter("skulpt", skulptAdapter);
    registerAdapter("pyodide", pyodideAdapter);
  });

  it("maps each demo example to its expected variant", () => {
    for (const example of examples as DemoExample[]) {
      const runtimeAdapter = adaptersByRuntime[example.runtime];
      const parsedTrace = runtimeAdapter(example.trace, example.code);
      expect(parsedTrace, `${example.title}: adapter did not parse trace`).not.toBeNull();

      const result = friendlyExplain({
        error: parsedTrace!,
        code: example.code,
      });

      expect(
        result.variantId,
        `${example.title}: expected ${example.expectedVariantId} but got ${result.variantId}`
      ).toBe(example.expectedVariantId);
    }
  });

  it("has at least one demo example for every current copydeck variant", () => {
    const allVariantIds = Object.entries(copydeck.errors).flatMap(([errorName, entry]) =>
      entry.variants.map((_, index) => `${errorName}/variants/${index}`)
    );

    const seenVariantIds = new Set<string>();
    for (const example of examples as DemoExample[]) {
      const runtimeAdapter = adaptersByRuntime[example.runtime];
      const parsedTrace = runtimeAdapter(example.trace, example.code);
      if (!parsedTrace) continue;

      const result = friendlyExplain({
        error: parsedTrace,
        code: example.code,
      });

      seenVariantIds.add(result.variantId);
    }

    for (const variantId of allVariantIds) {
      expect(seenVariantIds.has(variantId), `Missing demo coverage for ${variantId}`).toBe(true);
    }
  });
});
