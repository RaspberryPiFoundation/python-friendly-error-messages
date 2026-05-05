export const examples = [
  {
    title: "NameError - Undefined Variable",
    runtime: "skulpt",
    code: `print("Hello")
print(kittens)`,
    trace: `Traceback (most recent call last):
File "main.py", line 2, in <module>
NameError: name 'kittens' is not defined`
  },
  {
    title: "SyntaxError - Missing Colon",
    runtime: "skulpt",
    code: `for i in range(3)
  print(i)`,
    trace: `Traceback (most recent call last):
File "main.py", line 1
  for i in range(3)
                    ^
SyntaxError: invalid syntax`
  },
  {
    title: "AttributeError - Using .push() on List",
    runtime: "pyodide",
    code: `items = []
items.push(3)`,
    trace: `Traceback (most recent call last):
File "main.py", line 2, in <module>
  items.push(3)
AttributeError: 'list' object has no attribute 'push'`
  },
  {
    title: "TypeError - Adding String and Number",
    runtime: "pyodide",
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
    code: `result = 10 / 0
print(result)`,
    trace: `Traceback (most recent call last):
File "main.py", line 1, in <module>
  result = 10 / 0
ZeroDivisionError: division by zero`
  }
];
