// Browser-side Pyodide loader for the demo. Loads the pinned Pyodide build from the
// CDN once, installs the shared capture helper, and exposes:
//   - runAndCaptureTrace(code): real traceback string for a snippet ('' if no error)
//   - getVersions(): { pyodide, python } for display
import { PYODIDE_INDEX_URL } from './pyodide-config.js';
import { CAPTURE_PY } from './pyodide-capture.js';

let pyodidePromise = null;

function loadPyodideOnce() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const { loadPyodide } = await import(`${PYODIDE_INDEX_URL}pyodide.mjs`);
      const pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX_URL });
      pyodide.runPython(CAPTURE_PY);
      return pyodide;
    })();
  }
  return pyodidePromise;
}

export async function runAndCaptureTrace(code) {
  const pyodide = await loadPyodideOnce();
  pyodide.globals.set('__pfem_src', code);
  return pyodide.runPython('__pfem_capture(__pfem_src)');
}

export async function getVersions() {
  const pyodide = await loadPyodideOnce();
  const python = pyodide.runPython('import platform; platform.python_version()');
  return { pyodide: pyodide.version, python };
}
