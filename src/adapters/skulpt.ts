import type { AdapterFn, Trace } from "../types";

const lastLineTypeMessage = (raw: string) => {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  const tail = lines[lines.length - 1] || "";
  const m = tail.match(/^(\w+Error)\s*:\s*(.*)$/);
  return { type: m ? m[1] : null, message: m ? m[2] : tail, tail, lines };
};

export const skulptAdapter: AdapterFn = (raw, code) => {
  if (!/skulpt/i.test(raw) && !/Traceback/i.test(raw)) {
    // still try; skulpt often includes "on line X of", etc.
  }
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
