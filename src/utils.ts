export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export const tmpl = (
  s: string,
  vars: Record<string, string>,
  transforms?: Record<string, (v: string) => string>
) =>
  (s || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    if (!(k in vars)) return "";
    const v = String(vars[k]);
    return transforms?.[k] ? transforms[k](v) : v;
  });

export const safeRegexTest = (pattern: string, input: string) => {
  try {
    return new RegExp(pattern, "i").test(input || "");
  } catch {
    return false;
  }
};
