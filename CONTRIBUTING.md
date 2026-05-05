# Contributing

## Prerequisites

- **asdf** for environment management  
- **Node.js** (installed via asdf)  
- **npm** (bundled with Node)

## Development setup

Follow the guide at [asdf-vm.com](https://asdf-vm.com/).

Then install the Node.js plugin:

```bash
asdf plugin add nodejs
asdf install
```

This will read `.tool-versions` and install the appropriate version of Node.js automatically.

```bash
npm install
npm run build -- --watch
```

## Tests

```bash
npm test
```

To continuously watch for file changes:

```bash
npm run dev:test
```

## Pull requests

- Keep changes focused and small where possible.
- Add or update tests when behaviour changes.
- Update documentation when public APIs or workflows change.
- Make sure tests pass before opening a pull request.

## Reporting issues

When reporting a bug, include the Python code, the runtime you used, the error you received, and the behaviour you expected.
