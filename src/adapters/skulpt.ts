import type { AdapterFn, Trace } from "../types";

const lastLineTypeMessage = (raw: string) => {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  const tail = lines[lines.length - 1] || "";
  const m = tail.match(/^(\w+Error)\s*:\s*(.*)$/);
  return { type: m ? m[1] : null, message: m ? m[2] : tail, tail, lines };
};

export const skulptAdapter: AdapterFn = (raw, code) => {
  const { type, message, tail, lines } = lastLineTypeMessage(raw);
  let file: string | undefined, line: number | undefined, col: number | undefined;

  for (const L of lines) {
    const mm = L.match(/File\s+"([^"]+)",\s+line\s+(\d+)/i);
    if (mm) {
      file = mm[1];
      line = parseInt(mm[2], 10);
    }
  }
  if (!line) {
    const loc = tail.match(/\b(?:on|at)\s+line\s+(\d+)\s+(?:of|in)\s+([^\s:]+)\b/i);
    if (loc) {
      line = parseInt(loc[1], 10);
      file = loc[2];
    }
  }

  let name: string | undefined;
  const q = (message || "").match(/["']([^"']+)["']/);
  if (q) name = q[1];

  // Parse-quality gate:
  // We only accept this adapter output if we recovered at least one structured
  // signal that is useful for explanation selection or UI context:
  // - type: error class from the final traceback line (for copydeck matching)
  // - line: source location in user code (for codeLine/context extraction)
  // - name: quoted symbol from the message (helpful for NameError/KeyError/etc.)
  //
  // If none are present, the input is not parseable enough for this adapter,
  // so we return null and let the caller handle that failure explicitly.
  const hasStructuredSignal = Boolean(type || line || name);
  if (!hasStructuredSignal) return null;

  const t: Trace = {
    type,
    message,
    raw,
    file,
    line,
    col,
    frames: [],
    name,
    runtime: "skulpt"
  };

  if (code && line) {
    const lines = code.split(/\r?\n/);
    t.codeLine = lines[line - 1]?.trim();
    t.codeBefore = lines.slice(Math.max(0, line - 3), line - 1);
    t.codeAfter = lines.slice(line, line + 2);
  }
  return t;
};
