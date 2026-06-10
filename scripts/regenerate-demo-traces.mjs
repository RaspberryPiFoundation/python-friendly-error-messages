#!/usr/bin/env node
// Regenerate the cached `trace` field of every demo example by running its `code`
// through the pinned Pyodide build, so docs/demo-examples.js reflects exactly what
// the live demo (and the target Pyodide version) produces.
//
//   npm run regen:traces
//
// Re-run this whenever you bump PYODIDE_VERSION in docs/pyodide-config.js (and keep
// the `pyodide` devDependency at the same version).

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadPyodide } from 'pyodide';
import { examples } from '../docs/demo-examples.js';
import { CAPTURE_PY } from '../docs/pyodide-capture.js';
import { PYODIDE_VERSION } from '../docs/pyodide-config.js';

const DEMO_PATH = fileURLToPath(new URL('../docs/demo-examples.js', import.meta.url));

const esc = (s) => JSON.stringify(s);
const tpl = (s) =>
  '`' + s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';

async function main() {
  const pyodide = await loadPyodide();
  if (pyodide.version !== PYODIDE_VERSION) {
    console.warn(
      `Warning: pyodide devDependency is v${pyodide.version} but docs/pyodide-config.js pins v${PYODIDE_VERSION}. ` +
      `Install pyodide@${PYODIDE_VERSION} so cached traces match the live demo.`
    );
  }
  pyodide.runPython(CAPTURE_PY);

  let changed = 0;
  for (const example of examples) {
    pyodide.globals.set('__pfem_src', example.code);
    const trace = pyodide.runPython('__pfem_capture(__pfem_src)');
    if (!trace) {
      console.warn(`Warning: "${example.title}" ran without raising an error; trace left empty.`);
    }
    if (trace !== example.trace) changed++;
    example.trace = trace;
  }

  const body = examples
    .map(
      (e) =>
        `  {\n` +
        `    title: ${esc(e.title)},\n` +
        `    runtime: ${esc(e.runtime)},\n` +
        `    expectedVariantId: ${esc(e.expectedVariantId)},\n` +
        `    code: ${tpl(e.code)},\n` +
        `    trace: ${tpl(e.trace)}\n` +
        `  }`
    )
    .join(',\n');
  await writeFile(DEMO_PATH, `export const examples = [\n${body}\n];\n`, 'utf8');

  console.log(`Regenerated ${examples.length} traces from Pyodide v${pyodide.version} (${changed} changed).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
