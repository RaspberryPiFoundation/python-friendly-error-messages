import { loadCopydeck } from "./engine.js";
import type { CopyDeck } from "./types.js";

type Options = { base?: string };

export async function loadCopydeckFor(locale = "en", opts: Options = {}): Promise<CopyDeck> {
  const tryLocales = [locale];
  const baseLang = locale.split("-")[0];
  if (baseLang !== locale) tryLocales.push(baseLang);
  if (!tryLocales.includes("en")) tryLocales.push("en");

  let baseUrl: URL;
  if (opts.base) {
    baseUrl = new URL(opts.base, window.location.origin);
  } else {
    // try to resolve copydecks relative to package location
    // in bundled environments (webpack/vite), import.meta.url points to the bundle
    try {
      const metaUrl = import.meta.url;
      // construct path dynamically to avoid webpack static analysis
      const copydecksDir = 'copydecks';
      const separator = '/';
      const path = '.' + separator + copydecksDir + separator;
      
      // check if this looks like a bundled file
      if (metaUrl.includes('index.browser.js') || metaUrl.includes('dist/')) {
        // in a bundled environment, copydecks are in dist/copydecks
        const bundleDir = metaUrl.substring(0, metaUrl.lastIndexOf('/'));
        baseUrl = new URL(path, bundleDir);
      } else {
        baseUrl = new URL(path, metaUrl);
      }
    } catch {
      throw new Error(
        'Unable to resolve copydecks path. Please provide the base URL: ' +
        'loadCopydeckFor(locale, { base: "/path/to/copydecks/" })'
      );
    }
  }

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
  throw new Error(`No copydeck found for ${tryLocales.join(", ")}`);
}

