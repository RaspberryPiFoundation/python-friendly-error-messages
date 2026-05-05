# Python Friendly Error Messages

Todo:
- Set up automated testing and publishing through GitHub Actions
- Accessibility of output HTML

A small, runtime-agnostic, library that explains Python error messages in a friendlier way, inspired by [p5.js's Friendly Error System](https://p5js.org/contribute/friendly_error_system/).

It can be used in browser-based editors (like RPF's [Code Editor web component](https://github.com/RaspberryPiFoundation/editor-ui)) or any environment that executes Python code through Skulpt or Pyodide.

## Features

- Parses and normalises errors from Skulpt or Pyodide (via adapters)
- Matches errors against a copydeck (JSON rules and templates)
- Copydeck-based explanations can be localised
- Returns structured explanations as well as ready-made HTML snippets

## Usage

```javascript
import {
  loadCopydeckFor,
  registerAdapter,
  skulptAdapter,
  pyodideAdapter,
  friendlyExplain
} from "python-friendly-error-messages";

await loadCopydeckFor(navigator.language); // falls back to "en"

// register runtimes
registerAdapter("skulpt", skulptAdapter);
registerAdapter("pyodide", pyodideAdapter);

// later, when you have an error string and some code:
const result = friendlyExplain({
  error: rawTracebackString,
  code: editorCode,
  audience: "beginner"
});

// result.html is a ready-made snippet
// or use result.title, result.summary, result.steps, result.patch, result.trace
```

See the [demo](docs/README.md) for a full set of examples.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions.

In brief:

```bash
npm install
npm run build -- --watch
npm test
```

## Building

Create a clean build for distribution:

```
npm run build:all && npm run build:browser
```

Output files will be in `dist/`.

You can now import, and use it, elsewhere (see Usage notes).

The package is published to: https://github.com/RaspberryPiFoundation/python-friendly-error-messages/pkgs/npm/python-friendly-error-messages

## Publishing

```bash
npm publish
```
