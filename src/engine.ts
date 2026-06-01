import type { CopyDeck, ExplainOptions, ExplainResult, Section, Trace } from "./types";
import { escapeHtml, safeRegexTest, tmpl } from "./utils";

type InternalState = {
  copy?: CopyDeck;
  adapters: Record<string, (raw: string, code?: string) => Trace | null>;
};

const state: InternalState = { adapters: {} };

export const loadCopydeck = (deck: CopyDeck) => (state.copy = deck);

const getUiString = (key: keyof NonNullable<CopyDeck["ui"]>, fallback: string): string => {
  return state.copy?.ui?.[key] || fallback;
};

export const registerAdapter = (name: string, fn: (raw: string, code?: string) => Trace | null) =>
  (state.adapters[name] = fn);

const coerceTrace = (input: string | Error | Trace, code?: string, runtime?: string): Trace => {
  if ((input as Trace).raw !== undefined) return input as Trace;

  if (!runtime) {
    throw new Error("Runtime is required when error is a string or Error. Pass opts.runtime or parse with an adapter first.");
  }

  const adapter = state.adapters[runtime];
  if (!adapter) {
    throw new Error(`No adapter registered for runtime \"${runtime}\".`);
  }

  const raw = typeof input === "string" ? input : String((input as Error).stack || (input as Error).message || input);
  const parsed = adapter(raw, code);
  if (!parsed) {
    throw new Error(`Could not parse error for runtime \"${runtime}\".`);
  }
  return parsed;
};

const pickVariant = (trace: Trace, code: string | undefined, sections?: Section[]) => {
  const deck = state.copy;
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

  const linePart = trace.line ? `<span class="pfem__line">${escapeHtml(lineStr)} ${escapeHtml(String(trace.line))}</span>` : null;
  const filePart = trace.file ? `<span class="pfem__file">${escapeHtml(trace.file)}</span>` : null;
  const htmlLoc =
    linePart && filePart ? `${linePart} ${escapeHtml(inStr)} ${filePart}` :
    linePart ?? filePart ?? escapeHtml(thisFileStr);

  const htmlTransforms: Record<string, (v: string) => string> = {
    name:     (v) => `<span class="pfem__var">${escapeHtml(v)}</span>`,
    loc:      (_) => htmlLoc,
    codeLine: (v) => `<span class="pfem__code">${escapeHtml(v)}</span>`,
  };

  for (let i = 0; i < entry.variants.length; i++) {
    const v = entry.variants[i];
    if (!matches(v)) continue;

    const title   = tmpl(v.title,   vars);
    const summary = tmpl(v.summary, vars);
    const why     = v.why ? tmpl(v.why, vars) : undefined;
    const steps   = v.steps?.map((s) => tmpl(s, vars));
    const badges  = v.badges;

    const titleHtml   = tmpl(v.title,   vars, htmlTransforms);
    const summaryHtml = tmpl(v.summary, vars, htmlTransforms);
    const whyHtml     = v.why ? tmpl(v.why, vars, htmlTransforms) : undefined;
    const stepsHtml   = v.steps?.map((s) => tmpl(s, vars, htmlTransforms));

    let patch: string | undefined = undefined;
    if (trace.type === "AttributeError" && /\.push\s*\(/i.test(codeLine)) {
      patch = codeLine.replace(/\.push\s*\(/i, ".append(");
    } else if (trace.type === "NameError" && trace.name) {
      patch = `${trace.name} = 0\n${codeLine}`;
    } else if (trace.type === "SyntaxError" && /^(if|for|while|def|class|elif|else|try|except|with)\b/i.test(codeLine) && !/:$/.test(codeLine.trim())) {
      const trimmedCodeLine = codeLine.replace(/\s*$/, "");
      patch = /,\s*$/.test(trimmedCodeLine)
        ? trimmedCodeLine.replace(/,\s*$/, ":")
        : trimmedCodeLine + ":";
    } else if (trace.type === "TypeError" && /\+\s*[A-Za-z_][A-Za-z0-9_]*/.test(codeLine)) {
      patch = codeLine.replace(/\+\s*([A-Za-z_][A-Za-z0-9_]*)/, "+ str($1)");
    }

    const has = (s: Section) => !sections || sections.includes(s);
    const html = [
      has("title")   ? `<div class="pfem__title">${titleHtml}</div>` : "",
      has("summary") ? `<div class="pfem__summary">${summaryHtml}</div>` : "",
      has("why")     && whyHtml ? `<div class="pfem__why">${whyHtml}</div>` : "",
      has("steps")   && stepsHtml?.length ? `<ul class="pfem__steps">${stepsHtml.map((s) => `<li>${s}</li>`).join("")}</ul>` : "",
      has("patch")   && patch ? `<pre class="pfem__patch">${escapeHtml(patch)}</pre>` : "",
      has("details") ? `<details class="pfem__details"><summary>${escapeHtml(getUiString("originalError", "Original error"))}</summary><pre>${escapeHtml(
        (trace.type || getUiString("error", "Error")) + ": " + trace.message
      )}</pre></details>` : "",
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
  if (!state.copy) throw new Error("Copydeck not loaded");
  const code = opts.code;

  const trace = coerceTrace(opts.error, code, opts.runtime);
  if (code && trace.line && !trace.codeLine) {
    const lines = code.split(/\r?\n/);
    trace.codeLine = lines[trace.line - 1]?.trim();
  }

  const chosen = pickVariant(trace, code, opts.sections);
  if (!chosen) {
    return {
      trace,
      variantId: "Other/variants/0",
      title: getUiString("pythonError", "Python error"),
      summary: getUiString("fallbackSummary", "Start with the last line of the trace (message) and the highlighted code line."),
      why: getUiString("fallbackWhy", "The last line of the trace tells you the error type and main cause."),
      steps: [getUiString("fallbackStep", "Try a fix and run again.")],
      html: undefined
    };
  }

  return { trace, ...chosen };
};
