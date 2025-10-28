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

export type ExplainOptions = {
  error: string | Error | Trace;
  code?: string;
  audience?: "kid" | "beginner" | "intermediate";
  verbosity?: "brief" | "standard" | "guided";
  locale?: string;
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
  glossary?: Record<string, Record<string, string>>;
  errors: Record<string, { variants: CopyVariant[] }>;
};

export type AdapterFn = (raw: string, code?: string) => Trace | null;
