import type { AdapterFn, Trace } from "../types";

const lastLineTypeMessage = (raw: string) => {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  const tail = lines[lines.length - 1] || "";
  const m = tail.match(/^(\w+Error)\s*:\s*(.*)$/);
  return { type: m ? m[1] : null, message: m ? m[2] : tail, tail, lines };
};

export const pyodideAdapter: AdapterFn = (raw, code) => {
  const { type, message, tail, lines } = lastLineTypeMessage(raw);
  let file: string | undefined, line: number | undefined, col: number | undefined;

  for (const L of lines) {
    const mm = L.match(/File\s+"([^"]+)",\s+line\s+(\d+)/i);
    if (mm) {
      file = mm[1];
      line = parseInt(mm[2], 10);
    }
    const cc = L.match(/column\s+(\d+)/i);
    if (cc) col = parseInt(cc[1], 10);
  }

  let name: string | undefined;
  const q = (message || "").match(/["']([^"']+)["']/);
  if (q) name = q[1];

  const t: Trace = {
    type,
    message,
    raw,
    file,
    line,
    col,
    frames: [],
    name,
    runtime: "pyodide"
  };

  if (code && line) {
    const lines = code.split(/\r?\n/);
    t.codeLine = lines[line - 1]?.trim();
    t.codeBefore = lines.slice(Math.max(0, line - 3), line - 1);
    t.codeAfter = lines.slice(line, line + 2);
  }
  return t;
};
