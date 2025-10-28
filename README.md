# Python Friendly Error Messages

- [ ] Ensure all strings in `src/` are localised
- [ ] Consider renaming `explain()` to something like `friendlyExplain()`?
- [ ] Figure out where the built packages should live / be served from

A small, runtime-agnostic, library that explains Python error messages in a friendlier way, inspired by [p5.js's Friendly Error System](https://p5js.org/contribute/friendly_error_system/).

It can be used in browser-based editors (like RPF's [Code Editor web component](https://github.com/RaspberryPiFoundation/editor-ui)) or any environment that executes Python code through Skulpt or Pyodide.

## Features

- Parses and normalises errors from Skulpt or Pyodide (via adapters)
- Matches errors against a copydeck (JSON rules and templates)
- Copydeck-based explanations can be localised
- Returns structured explanations as well as ready-made HTML snippets

## Usage

```
import {
  loadCopydeckFor,
  registerAdapter,
  skulptAdapter,
  pyodideAdapter,
  explain
} from "python-friendly-errors";

await loadCopydeckFor(navigator.language); // falls back to "en"

// register runtimes
registerAdapter("skulpt", skulptAdapter);
registerAdapter("pyodide", pyodideAdapter);

// later, when you have an error string and some code:
const result = explain({
  error: rawTracebackString,
  code: editorCode,
  audience: "beginner",
  verbosity: "guided"
});

// result.html is a ready-made snippet
// or use result.title, result.summary, result.steps, result.patch, result.trace

```

## Development

### Prerequisites

- **asdf** for environment management  
- **Node.js** (installed via asdf)  
- **npm** (bundled with Node)

### Set up

Follow the guide at [asdf-vm.com](https://asdf-vm.com/).

Then install the Node.js plugin:

```bash
asdf plugin add nodejs
asdf install
```

This will read .tool-versions and install Node.js 22.11.0 automatically.

```
npm install
npm run build -- --watch
```

### Tests

```
npm test
```

To continuously watch for file changes:

```
npm run dev:test
```

### Building

Create a clean build for distribution:

```
npm run build:all && npm run build:browser
```

Output files will be in `dist/`.

You can now import it elsewhere (see Usage notes):

```
import { loadCopydeck, registerAdapter, skulptAdapter, explain } from "python-friendly-error
```
