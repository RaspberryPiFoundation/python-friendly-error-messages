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

  if (!line) {
    const m1 = raw.match(/on\s+line\s+(\d+)\s+of\s+([^\s:]+)(?::\s*([\s\S]*))?/i);
    if (m1) {
      line = parseInt(m1[1], 10);
      file = m1[2];
      const afterColon = (m1[3] || "").split(/\r?\n/);
      const snippet = afterColon.find(s => s.trim() && !/^\s*\^+\s*$/.test(s));
    }
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
    const codeLines = code.split(/\r?\n/);
    t.codeLine = codeLines[line - 1]?.trim();
    t.codeBefore = codeLines.slice(Math.max(0, line - 3), line - 1);
    t.codeAfter = codeLines.slice(line, line + 2);
  } else {
    const m1 = raw.match(/on\s+line\s+\d+\s+of\s+[^\s:]+:(?:\s*([\s\S]*))?/i);
    if (m1 && m1[1]) {
      const snippet = m1[1].split(/\r?\n/).find(s => s.trim() && !/^\s*\^+\s*$/.test(s));
      if (snippet) t.codeLine = snippet.trim();
    }
  }

  const looksLikeError = /Error\b/i.test(raw) || /Traceback/i.test(raw) || /pyodide/i.test(raw);
  if (!looksLikeError) return null;

  return t;
};
