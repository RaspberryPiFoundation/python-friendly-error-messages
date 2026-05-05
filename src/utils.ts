export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export const tmpl = (s: string, vars: Record<string, string>) =>
  (s || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => (k in vars ? String(vars[k]) : ""));

export const safeRegexTest = (pattern: string, input: string) => {
  try {
    return new RegExp(pattern, "i").test(input || "");
  } catch {
    return false;
  }
};
