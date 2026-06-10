// Single source of truth for the Pyodide version the demo runs against.
//
// To move to a new Pyodide release: bump PYODIDE_VERSION here, re-run `npm run regen:traces` to refresh the cached demo traces, and reload the demo.
// The browser demo loads Pyodide live from the matching CDN build; the Node regen script uses the `pyodide` devDependency in package.json (keep its version in sync with this).
export const PYODIDE_VERSION = "0.26.2";

export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
