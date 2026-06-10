import type { CopyDeck, ExplainOptions, ExplainResult, Runtime, Section, Trace } from "./types";
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

// Short non-cryptographic id, unique enough to keep aria-labelledby references distinct when several explanations are rendered on the same page
const uniqueId = () => `pfem-${Math.random().toString(36).slice(2, 8)}`;

export const registerAdapter = (name: string, fn: (raw: string, code?: string) => Trace | null) =>
  (state.adapters[name] = fn);

const coerceTrace = (input: string | Error | Trace, code?: string, runtime?: string): Trace | null => {
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
  // The error could not be parsed into a structured trace, so there is no friendly explanation to offer. Return null and let the caller fall back to the raw error
  if (!parsed) return null;
  // The runtime-agnostic adapter leaves `runtime: "unknown"`; this adds the concrete runtime we dispatched on so the trace carries the correct label
  parsed.runtime = runtime as Runtime;
  return parsed;
};

const pickVariant = (trace: Trace, code: string | undefined, sections?: Section[]) => {
  const deck = state.copy;
  const kind = trace.type;
  const entry = kind ? deck?.errors[kind] : undefined;
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
  const filePart = trace.file ? `<code class="pfem__file">${escapeHtml(trace.file)}</code>` : null;
  const htmlLoc =
    linePart && filePart ? `${linePart} ${escapeHtml(inStr)} ${filePart}` :
    linePart ?? filePart ?? escapeHtml(thisFileStr);

  const htmlTransforms: Record<string, (v: string) => string> = {
    name:     (v) => `<code class="pfem__var">${escapeHtml(v)}</code>`,
    loc:      (_) => htmlLoc,
    codeLine: (v) => `<code class="pfem__code">${escapeHtml(v)}</code>`,
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
    const id = uniqueId();
    const lang = deck?.meta.language ?? "en";
    const inner = [
      has("title")   ? `<p class="pfem__title" id="${id}-title">${titleHtml}</p>` : "",
      has("summary") ? `<p class="pfem__summary">${summaryHtml}</p>` : "",
      has("why")     && whyHtml ? `<p class="pfem__why">${whyHtml}</p>` : "",
      has("steps")   && stepsHtml?.length ? `<ul class="pfem__steps">${stepsHtml.map((s) => `<li>${s}</li>`).join("")}</ul>` : "",
      has("patch")   && patch ? `<div class="pfem__patch"><p class="pfem__patch-label">${escapeHtml(getUiString("suggestedFix", "Suggested fix"))}</p><pre class="pfem__patch-code"><code>${escapeHtml(patch)}</code></pre></div>` : "",
      has("details") ? `<details class="pfem__details"><summary>${escapeHtml(getUiString("originalError", "Original error"))}</summary><pre><code>${escapeHtml(
        (trace.type || getUiString("error", "Error")) + ": " + trace.message
      )}</code></pre></details>` : "",
    ].filter(Boolean).join("\n");

    // Wrap in a single labelled group so a screen reader perceives one explanation as a named unit
    const labelledBy = has("title") ? ` aria-labelledby="${id}-title"` : "";
    const html = `<div class="pfem" role="group" lang="${escapeHtml(lang)}"${labelledBy}>\n${inner}\n</div>`;

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

export const friendlyExplain = (opts: ExplainOptions): ExplainResult | null => {
  if (!state.copy) throw new Error("Copydeck not loaded");
  const code = opts.code;

  const trace = coerceTrace(opts.error, code, opts.runtime);
  // The error could not be parsed - no friendly explanation; caller uses the raw error
  if (!trace) return null;

  // Caller-provided file/line take precedence over whatever was parsed from the trace
  // Useful when the traceback's innermost frame references an internal file (eg. Pyodide's "<exec>") instead of the user's filename, or when the line needs correcting
  if (opts.file !== undefined) trace.file = opts.file;
  if (opts.line !== undefined) trace.line = opts.line;

  // (Re)derive the code context from the effective line: when the caller overrides the line, or when a pre-parsed trace arrived without a codeLine
  if (code && trace.line && (opts.line !== undefined || !trace.codeLine)) {
    const lines = code.split(/\r?\n/);
    trace.codeLine = lines[trace.line - 1]?.trim();
    trace.codeBefore = lines.slice(Math.max(0, trace.line - 3), trace.line - 1);
    trace.codeAfter = lines.slice(trace.line, trace.line + 2);
  }

  const chosen = pickVariant(trace, code, opts.sections);
  // No copydeck entry/variant matched this error. Return null so the caller can fall back to showing the raw Python/Pyodide error as-is
  if (!chosen) return null;

  return { trace, ...chosen };
};
