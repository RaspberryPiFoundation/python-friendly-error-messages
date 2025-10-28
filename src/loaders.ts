import { loadCopydeck } from "./engine";
import type { CopyDeck } from "./types";

/**
 * Loads a copydeck from /copydecks/{locale}/copydeck.json.
 * Falls back to a base language (e.g. "en" from "en-GB") or "en".
 */
export async function loadCopydeckFor(locale: string = "en"): Promise<CopyDeck> {
  const tryLocales = [locale];
  const base = locale.split("-")[0];
  if (base !== locale) tryLocales.push(base);
  if (!tryLocales.includes("en")) tryLocales.push("en");

  for (const lang of tryLocales) {
    try {
      const res = await fetch(`/copydecks/${lang}/copydeck.json`);
      if (res.ok) {
        const deck = await res.json();
        loadCopydeck(deck);
        return deck;
      }
    } catch {
      /* try next */
    }
  }
  throw new Error(`No copydeck found for ${tryLocales.join(", ")}`);
}
