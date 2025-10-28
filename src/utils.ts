export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export const tmpl = (s: string, vars: Record<string, string>) =>
  (s || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => (k in vars ? String(vars[k]) : ""));

export const applyGlossary = (text: string, glossary: Record<string, string> | undefined) => {
  if (!glossary) return text;
  let out = String(text || "");
  for (const [from, to] of Object.entries(glossary)) {
    out = out.replace(new RegExp(from, "gi"), to);
  }
  return out;
};

export const safeRegexTest = (pattern: string, input: string) => {
  try {
    return new RegExp(pattern, "i").test(input || "");
  } catch {
    return false;
  }
};
