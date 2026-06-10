export type Runtime = "skulpt" | "pyodide" | "unknown";

export type Trace = {
  type: string | null;
  message: string;
  raw: string;
  file?: string;
  line?: number;
  col?: number;
  frames?: Array<{ file?: string; line?: number; func?: string }>;
  name?: string;
  token?: string;
  codeLine?: string;
  codeBefore?: string[];
  codeAfter?: string[];
  runtime: Runtime;
  version?: string;
};

export type Section = "title" | "summary" | "why" | "steps" | "patch" | "details";

export type ExplainOptions = {
  error: string | Error | Trace;
  code?: string;
  /**
   * Override the source file, instead of using the one parsed from the trace.
   * Useful when the traceback's innermost frame references an internal file
   * (eg. Pyodide's "<exec>") rather than the user's filename.
   */
  file?: string;
  /** Override the source line, instead of using the one parsed from the trace. */
  line?: number;
  locale?: string;
  runtime?: string;
  sections?: Section[];
};

export type ExplainResult = {
  trace: Trace;
  variantId: string;
  title: string;
  summary: string;
  why?: string;
  steps?: string[];
  patch?: string;
  badges?: string[];
  html?: string;
};

export type CopyVariant = {
  if?: {
    match_message?: string[];
    not_message?: string[];
    match_code?: string[];
    not_code?: string[];
  };
  title: string;
  summary: string;
  why?: string;
  steps?: string[];
  badges?: string[];
};

export type CopyDeck = {
  meta: { language: string; version: number };
  errors: Record<string, { variants: CopyVariant[] }>;
  ui?: {
    line?: string;
    in?: string;
    thisFile?: string;
    originalError?: string;
    error?: string;
    copydeckNotLoaded?: string;
    suggestedFix?: string;
  };
};

export type AdapterFn = (raw: string, code?: string) => Trace | null;
