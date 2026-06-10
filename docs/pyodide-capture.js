// Python helper that runs a snippet as `main.py` and returns the *real* traceback
// string Python produces (or '' when it runs cleanly). Shared by the browser demo
// (run-pyodide.js) and the Node regen script (scripts/regenerate-demo-traces.mjs)
// so the cached demo traces are byte-identical to what the live demo generates.
//
// - SyntaxError is reported via format_exception_only (no interpreter frames, but it
//   still includes the `File "main.py", line N` + caret + message the adapter needs).
// - Runtime errors use format_exception with the exec() frame stripped (tb_next), so
//   the trace reads as if main.py ran at top level.
export const CAPTURE_PY = `
import traceback


def __pfem_capture(src):
    try:
        code = compile(src, "main.py", "exec")
    except SyntaxError as exc:
        return "".join(traceback.format_exception_only(type(exc), exc)).rstrip()
    try:
        exec(code, {"__name__": "__main__"})
    except SystemExit:
        return ""
    except BaseException as exc:
        tb = exc.__traceback__.tb_next
        return "".join(traceback.format_exception(type(exc), exc, tb)).rstrip()
    return ""
`;
