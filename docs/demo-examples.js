export const examples = [
  {
    title: "NameError - Variable Not Created Yet",
    runtime: "skulpt",
    expectedVariantId: "NameError/variants/0",
    code: `def outer():
  def inner():
    return total

  print(inner())
  total = 10

outer()`,
    trace: `Traceback (most recent call last):
File "main.py", line 8, in <module>
  outer()
File "main.py", line 5, in outer
  print(inner())
File "main.py", line 3, in inner
  return total
NameError: cannot access free variable 'total' where it is not associated with a value in enclosing scope`
  },
  {
    title: "NameError - Variable Not Defined Here",
    runtime: "skulpt",
    expectedVariantId: "NameError/variants/1",
    code: `print("Hello")
print(kittens)`,
    trace: `Traceback (most recent call last):
File "main.py", line 2, in <module>
NameError: name 'kittens' is not defined`
  },
  {
    title: "SyntaxError - Missing Colon",
    runtime: "skulpt",
    expectedVariantId: "SyntaxError/variants/0",
    code: `for i in range(3)
  print(i)`,
    trace: `Traceback (most recent call last):
File "main.py", line 1
  for i in range(3)
                    ^
SyntaxError: invalid syntax`
  },
  {
    title: "SyntaxError - Comma Instead Of Colon",
    runtime: "pyodide",
    expectedVariantId: "SyntaxError/variants/1",
    code: `if score > 10,
  print("Great")`,
    trace: `Traceback (most recent call last):
File "main.py", line 1
  if score > 10,
               ^
SyntaxError: invalid syntax`
  },
  {
    title: "SyntaxError - Too Many Colons",
    runtime: "pyodide",
    expectedVariantId: "SyntaxError/variants/2",
    code: `if score > 10::
  print("Great")`,
    trace: `Traceback (most recent call last):
File "main.py", line 1
  if score > 10::
                ^
SyntaxError: invalid syntax`
  },
  {
    title: "SyntaxError - Unterminated String",
    runtime: "pyodide",
    expectedVariantId: "SyntaxError/variants/5",
    code: `print("Hello`,
    trace: `Traceback (most recent call last):
File "main.py", line 1
  print("Hello
        ^
SyntaxError: unterminated string literal (detected at line 1)`
  },
  {
    title: "SyntaxError - Missing Comma",
    runtime: "pyodide",
    expectedVariantId: "SyntaxError/variants/6",
    code: `numbers = [1 2, 3]`,
    trace: `Traceback (most recent call last):
File "main.py", line 1
  numbers = [1 2, 3]
             ^
SyntaxError: invalid syntax. Perhaps you forgot a comma?`
  },
  {
    title: "SyntaxError - Bracket Not Closed",
    runtime: "pyodide",
    expectedVariantId: "SyntaxError/variants/3",
    code: `total = (1 + 2`,
    trace: `Traceback (most recent call last):
File "main.py", line 1
  total = (1 + 2
          ^
SyntaxError: '(' was never closed`
  },
  {
    title: "SyntaxError - Closing Bracket Mismatch",
    runtime: "pyodide",
    expectedVariantId: "SyntaxError/variants/4",
    code: `values = [1, 2, 3)
print(values)`,
    trace: `Traceback (most recent call last):
File "main.py", line 1
  values = [1, 2, 3)
                    ^
SyntaxError: closing parenthesis ')' does not match opening bracket '['`
  },
  {
    title: "SyntaxError - Assignment In Condition",
    runtime: "pyodide",
    expectedVariantId: "SyntaxError/variants/7",
    code: `if score = 10:
  print("Great")`,
    trace: `Traceback (most recent call last):
File "main.py", line 1
  if score = 10:
     ^
SyntaxError: cannot assign to name 'score'`
  },
  {
    title: "SyntaxError - Incomplete Input",
    runtime: "pyodide",
    expectedVariantId: "SyntaxError/variants/8",
    code: `value =`,
    trace: `Traceback (most recent call last):
File "main.py", line 3
  value =
         ^
SyntaxError: incomplete input`
  },
  {
    title: "SyntaxError - Invalid Operator",
    runtime: "pyodide",
    expectedVariantId: "SyntaxError/variants/9",
    code: `count = 0
count++`,
    trace: `Traceback (most recent call last):
File "main.py", line 2
  count++
        ^
SyntaxError: invalid syntax`
  },
  {
    title: "SyntaxError - Generic Mismatch",
    runtime: "pyodide",
    expectedVariantId: "SyntaxError/variants/10",
    code: `result = 1 +* 2`,
    trace: `Traceback (most recent call last):
File "main.py", line 1
  result = 1 +* 2
              ^
SyntaxError: invalid syntax`
  },
  {
    title: "IndentationError - Unexpected Indent",
    runtime: "pyodide",
    expectedVariantId: "IndentationError/variants/0",
    code: `print("Start")
  print("Oops")`,
    trace: `Traceback (most recent call last):
File "main.py", line 2
    print("Oops")
    ^
IndentationError: unexpected indent`
  },
  {
    title: "AttributeError - Using .push() on List",
    runtime: "pyodide",
    expectedVariantId: "AttributeError/variants/0",
    code: `items = []
items.push(3)`,
    trace: `Traceback (most recent call last):
File "main.py", line 2, in <module>
  items.push(3)
AttributeError: 'list' object has no attribute 'push'`
  },
  {
    title: "AttributeError - Unknown Method",
    runtime: "pyodide",
    expectedVariantId: "AttributeError/variants/1",
    code: `name = "Ada"
name.shrink()`,
    trace: `Traceback (most recent call last):
File "main.py", line 2, in <module>
  name.shrink()
AttributeError: 'str' object has no attribute 'shrink'`
  },
  {
    title: "TypeError - Adding String and Number",
    runtime: "pyodide",
    expectedVariantId: "TypeError/variants/0",
    code: `age = 10
message = "I am " + age + " years old"`,
    trace: `Traceback (most recent call last):
File "main.py", line 2, in <module>
  message = "I am " + age + " years old"
TypeError: can only concatenate str (not "int") to str`
  },
  {
    title: "NameError - Variable Used Before Assignment",
    runtime: "skulpt",
    expectedVariantId: "UnboundLocalError/variants/0",
    code: `def calculate():
  result = x + 5
  x = 10
  return result

calculate()`,
    trace: `Traceback (most recent call last):
File "main.py", line 5, in <module>
  calculate()
File "main.py", line 2, in calculate
UnboundLocalError: local variable 'x' referenced before assignment`
  },
  {
    title: "IndexError - List Index Out of Range",
    runtime: "pyodide",
    expectedVariantId: "IndexError/variants/0",
    code: `numbers = [1, 2, 3]
print(numbers[5])`,
    trace: `Traceback (most recent call last):
File "main.py", line 2, in <module>
  print(numbers[5])
IndexError: list index out of range`
  },
  {
    title: "KeyError - Dictionary Key Not Found",
    runtime: "skulpt",
    expectedVariantId: "KeyError/variants/0",
    code: `person = {"name": "Alice", "age": 30}
print(person["city"])`,
    trace: `Traceback (most recent call last):
File "main.py", line 2, in <module>
  print(person["city"])
KeyError: 'city'`
  },
  {
    title: "ZeroDivisionError - Division by Zero",
    runtime: "pyodide",
    expectedVariantId: "ZeroDivisionError/variants/0",
    code: `result = 10 / 0
print(result)`,
    trace: `Traceback (most recent call last):
File "main.py", line 1, in <module>
  result = 10 / 0
ZeroDivisionError: division by zero`
  },
  {
    title: "Other - ValueError Fallback",
    runtime: "pyodide",
    expectedVariantId: "Other/variants/0",
    code: `int("abc")`,
    trace: `Traceback (most recent call last):
File "main.py", line 1, in <module>
  int("abc")
ValueError: invalid literal for int() with base 10: 'abc'`
  }
];
