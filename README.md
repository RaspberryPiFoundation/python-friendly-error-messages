# Python Friendly Error Messages

Todo:
- Set up automated testing and publishing through GitHub Actions
- Open source

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
  audience: "beginner",
  verbosity: "guided"
});

// result.html is a ready-made snippet
// or use result.title, result.summary, result.steps, result.patch, result.trace
```

See the [demo](docs/README.md) for a full set of examples.

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

This will read `.tool-versions` and install the appropriate version of Node.js automatically.

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

You can now import, and use it, elsewhere (see Usage notes).

The package is published to: https://github.com/RaspberryPiFoundation/python-friendly-error-messages/pkgs/npm/python-friendly-error-messages
