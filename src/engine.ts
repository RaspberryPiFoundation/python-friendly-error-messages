import type { CopyDeck, ExplainOptions, ExplainResult, Trace } from "./types";
import { applyGlossary, escapeHtml, safeRegexTest, tmpl } from "./utils";

type InternalState = {
  copy?: CopyDeck;
  adapters: Record<string, (raw: string, code?: string) => Trace | null>;
};

const S: InternalState = { adapters: {} };

export const loadCopydeck = (deck: CopyDeck) => (S.copy = deck);

const getUiString = (key: keyof NonNullable<CopyDeck["ui"]>, fallback: string): string => {
  return S.copy?.ui?.[key] || fallback;
};

export const registerAdapter = (name: string, fn: (raw: string, code?: string) => Trace | null) =>
  (S.adapters[name] = fn);

const coerceTrace = (input: string | Error | Trace, code?: string): Trace => {
  if ((input as Trace).raw !== undefined) return input as Trace;
  const raw = typeof input === "string" ? input : String((input as Error).stack || (input as Error).message || input);
  // try adapters in registration order
  for (const key of Object.keys(S.adapters)) {
    const t = S.adapters[key](raw, code);
    if (t) return t;
  }
  // generic fallback
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  const tail = lines[lines.length - 1] || "";
  const m = tail.match(/^(\w+Error)\s*:\s*(.*)$/);
  const t: Trace = {
    type: m ? m[1] : null,
    message: m ? m[2] : tail,
    raw,
    runtime: "unknown"
  };
  if (code) {
    t.codeLine = code.split(/\r?\n/)[(t.line || 1) - 1]?.trim();
  }
  return t;
};

const pickVariant = (trace: Trace, code: string | undefined, audience: string) => {
  const deck = S.copy;
  const kind = trace.type && deck?.errors[trace.type] ? trace.type : "Other";
  const entry = deck?.errors[kind];
  if (!entry) return null;

  const codeLine = trace.codeLine || "";
  const msg = trace.message || "";

  const matches = (v: any) => {
    const cond = v.if;
    if (!cond) return true;
    if (cond.match_message?.some((p: string) => safeRegexTest(p, msg)) === false && cond.match_message?.length) return false;
    if (cond.not_message?.some((p: string) => safeRegexTest(p, msg))) return false;
    if (cond.match_code?.some((p: string) => safeRegexTest(p, codeLine)) === false && cond.match_code?.length) return false;
    if (cond.not_code?.some((p: string) => safeRegexTest(p, codeLine))) return false;
    return true;
  };

  const lineStr = getUiString("line", "line");
  const inStr = getUiString("in", "in");
  const thisFileStr = getUiString("thisFile", "this file");
  const loc =
    trace.line && trace.file ? `${lineStr} ${trace.line} ${inStr} ${trace.file}` :
    trace.line ? `${lineStr} ${trace.line}` :
    trace.file || thisFileStr;

  const vars = {
    loc,
    name: trace.name || "",
    codeLine: codeLine
  };

  for (let i = 0; i < entry.variants.length; i++) {
    const v = entry.variants[i];
    if (!matches(v)) continue;

    const glob = S.copy?.glossary?.[audience] || undefined;
    const title = applyGlossary(tmpl(v.title, vars), glob);
    const summary = applyGlossary(tmpl(v.summary, vars), glob);
    const why = v.why ? applyGlossary(tmpl(v.why, vars), glob) : undefined;
    const steps = v.steps?.map((s) => applyGlossary(tmpl(s, vars), glob));
    const badges = v.badges;

    let patch: string | undefined = undefined;
    if (trace.type === "AttributeError" && /\.push\s*\(/i.test(codeLine)) {
      patch = codeLine.replace(/\.push\s*\(/i, ".append(");
    } else if (trace.type === "NameError" && trace.name) {
      patch = `${trace.name} = 0\n${codeLine}`;
    } else if (trace.type === "SyntaxError" && /^(if|for|while|def|class|elif|else|try|except|with)\b/i.test(codeLine) && !/:$/.test(codeLine.trim())) {
      patch = codeLine.replace(/\s*$/, "") + ":";
    } else if (trace.type === "TypeError" && /\+\s*[A-Za-z_][A-Za-z0-9_]*/.test(codeLine)) {
      patch = codeLine.replace(/\+\s*([A-Za-z_][A-Za-z0-9_]*)/, "+ str($1)");
    }

    const html = [
      `<div class="pfem__title">${escapeHtml(title)}</div>`,
      `<div class="pfem__summary">${summary}</div>`,
      why ? `<div class="pfem__why">${why}</div>` : "",
      steps?.length ? `<ul class="pfem__steps">${steps.map((s) => `<li>${s}</li>`).join("")}</ul>` : "",
      patch ? `<pre class="pfem__patch">${escapeHtml(patch)}</pre>` : "",
      `<details class="pfem__details"><summary>${escapeHtml(getUiString("errorDetails", "Error details"))}</summary><pre>${escapeHtml(
        (trace.type || getUiString("error", "Error")) + ": " + trace.message
      )}</pre></details>`
    ].filter(Boolean).join("\n");

    return {
      variantId: `${kind}/variants/${i}`,
      title,
      summary,
      why,
      steps,
      badges,
      patch,
      html
    };
  }
  return null;
};

export const friendlyExplain = (opts: ExplainOptions): ExplainResult => {
  if (!S.copy) throw new Error("Copydeck not loaded");
  const audience = opts.audience || "beginner";
  const verbosity = opts.verbosity || "standard";
  const code = opts.code;

  const trace = coerceTrace(opts.error, code);
  if (code && trace.line && !trace.codeLine) {
    const lines = code.split(/\r?\n/);
    trace.codeLine = lines[trace.line - 1]?.trim();
  }

  const chosen = pickVariant(trace, code, audience);
  if (!chosen) {
    return {
      trace,
      variantId: "Other/variants/0",
      title: getUiString("pythonError", "Python error"),
      summary: getUiString("fallbackSummary", "Start with the last line of the message and the highlighted code line."),
      why: getUiString("fallbackWhy", "The last line of the traceback tells you the error type and main cause."),
      steps: [getUiString("fallbackStep", "Fix one small thing and run again.")],
      html: undefined
    };
  }

  // not convinced by this implementation, and may decide to drop the verbosity option entirely...
  if (verbosity === "brief") {
    chosen.why = undefined;
    chosen.steps = chosen.steps?.slice(0, 1);
  }

  return { trace, ...chosen };
};
