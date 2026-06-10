import { describe, it, expect, beforeAll } from "vitest";
import { friendlyExplain, loadCopydeck, registerAdapter } from "../src/engine";
import { cpythonAdapter } from "../src/adapters/cpython";
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
  skulpt: cpythonAdapter,
  pyodide: cpythonAdapter,
};

describe("copydeck/demo coverage", () => {
  beforeAll(() => {
    loadCopydeck(copydeck as any);
    registerAdapter("skulpt", cpythonAdapter);
    registerAdapter("pyodide", cpythonAdapter);
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
      expect(result, `${example.title}: no friendly explanation returned`).not.toBeNull();

      expect(
        result!.variantId,
        `${example.title}: expected ${example.expectedVariantId} but got ${result!.variantId}`
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
      if (result) seenVariantIds.add(result.variantId);
    }

    for (const variantId of allVariantIds) {
      expect(seenVariantIds.has(variantId), `Missing demo coverage for ${variantId}`).toBe(true);
    }
  });
});
