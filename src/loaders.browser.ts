import { loadCopydeck } from "./engine.js";
import type { CopyDeck } from "./types.js";
import enCopydeck from "../copydecks/en/copydeck.json";

// is this the best way to do this when we come to adding more languages / copydecks?
const bundledCopydecks: Record<string, CopyDeck> = {
  en: enCopydeck as CopyDeck,
};

type Options = { base?: string };

export async function loadCopydeckFor(locale = "en", opts: Options = {}): Promise<CopyDeck> {
  const tryLocales = [locale];
  const baseLang = locale.split("-")[0];
  if (baseLang !== locale) tryLocales.push(baseLang);
  if (!tryLocales.includes("en")) tryLocales.push("en");

  // first try bundled copydecks (ie. available in browser bundle)
  for (const lang of tryLocales) {
    if (bundledCopydecks[lang]) {
      const deck = bundledCopydecks[lang];
      loadCopydeck(deck);
      return deck;
    }
  }

  // fallback to fetch if base URL is provided (eg. additional copydecks for locales not bundled)
  if (opts.base) {
    const baseUrl = new URL(opts.base, window.location.origin);
    for (const lang of tryLocales) {
      try {
        const url = new URL(`${lang}/copydeck.json`, baseUrl).toString();
        const res = await fetch(url);
        if (res.ok) {
          const deck = (await res.json()) as CopyDeck;
          loadCopydeck(deck);
          return deck;
        }
      } catch {}
    }
  }

  throw new Error(`No copydeck found for ${tryLocales.join(", ")}`);
}

