import { loadCopydeck } from "./engine.js";
import type { CopyDeck } from "./types.js";

type Options = { base?: string };

export async function loadCopydeckFor(locale = "en", opts: Options = {}): Promise<CopyDeck> {
  const tryLocales = [locale];
  const baseLang = locale.split("-")[0];
  if (baseLang !== locale) tryLocales.push(baseLang);
  if (!tryLocales.includes("en")) tryLocales.push("en");

  const baseUrl = opts.base
    ? new URL(opts.base, window.location.origin)
    : new URL("./copydecks/", import.meta.url);

  for (const lang of tryLocales) {
    try {
      const url = new URL(`${lang}/copydeck.json`, baseUrl).toString();
      const res = await fetch(url);
      if (res.ok) {
        const deck = (await res.json()) as CopyDeck;
        loadCopydeck(deck);
        return deck;
      }
    } catch { /* try next */ }
  }
  throw new Error(`No copydeck found for ${tryLocales.join(", ")}`);
}

