import { describe, it, expect } from "vitest";
import { friendlyExplain, loadCopydeck, registerAdapter } from "../src/engine";
import { skulptAdapter } from "../src/adapters/skulpt";

const copydeck = {
  meta: { language: "en", version: 1 },
  glossary: { kid: { variable: "name", function: "recipe", object: "thing" } },
  errors: {
    NameError: {
      variants: [
        {
          title: "This name doesn't exist yet",
          summary: "Your code uses \"{{name}}\", but it hasn't been created yet. Check {{loc}}.",
          why: "Python needs to see a line that creates \"{{name}}\" before you use it.",
          steps: ["Make it first (e.g. {{name}} = 0).", "Check spelling."]
        },
        {
          if: { match_message: ["is not defined"] },
          title: "This name doesn't exist here",
          summary: "\"{{name}}\" might be created somewhere else, but you're using it at {{loc}}.",
          why: "A name created in another place might not be available here.",
          steps: ["Move the line that makes it earlier."]
        }
      ]
    },
    SyntaxError: {
      variants: [
        {
          if: { match_code: ["^(\\s*)(if|for|while|def|class|elif|else|try|except|with)\\b"], not_code: [":\\s*$"] },
          title: "Missing colon (:) at the end",
          summary: "This line starts a block and needs a colon at {{loc}}: {{codeLine}}",
          steps: ["Add a colon (:) at the end."]
        },
        {
          title: "The line is incomplete or mismatched",
          summary: "Something is missing or extra.",
          steps: ["Match (), [], {}, quotes, and colons."]
        }
      ]
    },
    AttributeError: {
      variants: [
        {
          if: { match_code: ["\\.push\\s*\\("], match_message: ["'push'"] },
          title: "Lists don't have that feature",
          summary: "You're calling a list method that doesn't exist.",
          steps: ["Use list.append(value)."]
        },
        {
          title: "This thing doesn't have that name after the dot",
          summary: "No such attribute.",
          steps: ["Check spelling."]
        }
      ]
    },
    Other: {
      variants: [
        { title: "Python error", summary: "Look at the last line.", steps: ["Fix a small thing and retry."] }
      ]
    }
  }
};

describe("engine", () => {
  loadCopydeck(copydeck as any);
  registerAdapter("skulpt", skulptAdapter);

  it("explains NameError with name and patch", () => {
    const code = `print("Hello")\nprint(kittens)\n`;
    const raw = `Traceback (most recent call last):
  File "main.py", line 2, in <module>
NameError: name 'kittens' is not defined`;
    const res = friendlyExplain({ error: raw, code, audience: "beginner" });
    expect(res.trace.type).toBe("NameError");
    expect(res.title).toMatch(/name/i);
    expect(res.summary).toMatch(/kittens/);
    expect(res.patch).toMatch(/kittens\s*=\s*0/);
    expect(res.variantId).toMatch(/NameError\/variants\/\d+/);
  });

  it("suggests colon for SyntaxError", () => {
    const code = `for i in range(3)\n  print(i)`;
    const raw = `Traceback (most recent call last):
  File "main.py", line 1
SyntaxError: invalid syntax`;
    const res = friendlyExplain({ error: raw, code });
    expect(res.trace.type).toBe("SyntaxError");
    expect(res.title).toMatch(/colon/i);
    expect(res.patch).toMatch(/:\s*$/);
  });

  it("handles AttributeError .push -> .append", () => {
    const code = `items = []\nitems.push(3)`;
    const raw = `Traceback (most recent call last):
  File "main.py", line 2
AttributeError: 'list' object has no attribute 'push'`;
    const res = friendlyExplain({ error: raw, code });
    expect(res.trace.type).toBe("AttributeError");
    expect(res.patch).toContain(".append(");
  });
});
