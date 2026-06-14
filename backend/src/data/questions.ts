export interface Question {
  id: string;
  language: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extra-hard';
  prompt: string;
  choices: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  explanation: string;
}

export const questions: Question[] = [

  // ─── Python + Arrays ────────────────────────────────────────────────────────

  {
    id: 'py-arr-01',
    language: 'Python',
    topic: 'arrays',
    difficulty: 'easy',
    prompt: 'What is the output of `print(len([1, 2, 3, 4, 5]))`?',
    choices: ['4', '5', '6', 'Error'],
    correct_index: 1,
    explanation: '`len()` returns the number of elements. The list has 5 elements.',
  },
  {
    id: 'py-arr-02',
    language: 'Python',
    topic: 'arrays',
    difficulty: 'easy',
    prompt: 'Which method adds an element to the END of a Python list?',
    choices: ['list.add()', 'list.append()', 'list.insert()', 'list.push()'],
    correct_index: 1,
    explanation: '`append()` adds an element to the end of a list.',
  },
  {
    id: 'py-arr-03',
    language: 'Python',
    topic: 'arrays',
    difficulty: 'easy',
    prompt: 'What does `[1, 2, 3][1:3]` return?',
    choices: ['[1, 2]', '[2, 3]', '[1, 2, 3]', '[3]'],
    correct_index: 1,
    explanation: 'Slicing `[1:3]` returns elements at index 1 and 2 (not 3).',
  },
  {
    id: 'py-arr-04',
    language: 'Python',
    topic: 'arrays',
    difficulty: 'easy',
    prompt: 'What is the index of the LAST element in a list `a` of length n?',
    choices: ['n', 'n+1', 'n-1', '-n'],
    correct_index: 2,
    explanation: 'Python lists are zero-indexed, so the last element is at index n-1.',
  },
  {
    id: 'py-arr-05',
    language: 'Python',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'What is the output of `a = [1,2,3]; a[1:2] = [7,8]; print(a)`?',
    choices: ['[1, 7, 8, 3]', '[1, 7, 8, 2, 3]', '[7, 8, 3]', '[1, 2, 7, 8, 3]'],
    correct_index: 0,
    explanation: 'Slice assignment replaces index 1 up to (not including) 2 with [7, 8].',
  },
  {
    id: 'py-arr-06',
    language: 'Python',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'Which of the following creates a SHALLOW copy of list `a`?',
    choices: ['b = a', 'b = a.copy()', 'b = copy.deepcopy(a)', 'b = list(map(id, a))'],
    correct_index: 1,
    explanation: '`a.copy()` creates a shallow copy. `b = a` just creates another reference.',
  },
  {
    id: 'py-arr-07',
    language: 'Python',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'What does `list(reversed([3, 1, 4, 1, 5]))` return?',
    choices: ['[5, 1, 4, 1, 3]', '[3, 1, 4, 1, 5]', '[1, 1, 3, 4, 5]', 'Error'],
    correct_index: 0,
    explanation: '`reversed()` returns a reversed iterator; `list()` materialises it.',
  },
  {
    id: 'py-arr-08',
    language: 'Python',
    topic: 'arrays',
    difficulty: 'hard',
    prompt: 'What is the time complexity of inserting an element at the beginning of a Python list?',
    choices: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correct_index: 2,
    explanation: 'Python lists are dynamic arrays; inserting at position 0 shifts all other elements — O(n).',
  },
  {
    id: 'py-arr-09',
    language: 'Python',
    topic: 'arrays',
    difficulty: 'hard',
    prompt: 'What does `[x**2 for x in range(5) if x % 2 == 0]` produce?',
    choices: ['[0, 4, 16]', '[1, 9, 25]', '[0, 1, 4, 9, 16]', '[4, 16]'],
    correct_index: 0,
    explanation: 'Even values in range(5) are 0, 2, 4. Their squares are 0, 4, 16.',
  },
  {
    id: 'py-arr-10',
    language: 'Python',
    topic: 'arrays',
    difficulty: 'hard',
    prompt: 'Given `a = [[0]*3]*3`, what happens when you run `a[0][0] = 9`?',
    choices: [
      'Only a[0][0] becomes 9',
      'All rows have 9 at index 0',
      'An IndexError is raised',
      'a becomes [[9, 0, 0], [0, 0, 0], [0, 0, 0]]',
    ],
    correct_index: 1,
    explanation: '`[[0]*3]*3` creates 3 references to the SAME inner list, so mutating one row mutates all.',
  },

  // ─── Python + Strings ───────────────────────────────────────────────────────

  {
    id: 'py-str-01',
    language: 'Python',
    topic: 'strings',
    difficulty: 'easy',
    prompt: 'What does `"hello".upper()` return?',
    choices: ['hello', 'HELLO', 'Hello', 'hELLO'],
    correct_index: 1,
    explanation: '`upper()` converts all lowercase letters to uppercase.',
  },
  {
    id: 'py-str-02',
    language: 'Python',
    topic: 'strings',
    difficulty: 'easy',
    prompt: 'Which method removes leading and trailing whitespace from a string?',
    choices: ['strip()', 'trim()', 'clean()', 'remove()'],
    correct_index: 0,
    explanation: '`str.strip()` removes leading and trailing whitespace.',
  },
  {
    id: 'py-str-03',
    language: 'Python',
    topic: 'strings',
    difficulty: 'easy',
    prompt: 'What does `"a,b,c".split(",")` return?',
    choices: ['["a,b,c"]', '["a", "b", "c"]', '("a", "b", "c")', '["a,b", "c"]'],
    correct_index: 1,
    explanation: '`split(",")` splits the string on every comma.',
  },
  {
    id: 'py-str-04',
    language: 'Python',
    topic: 'strings',
    difficulty: 'easy',
    prompt: 'What is the output of `len("Python")`?',
    choices: ['5', '6', '7', '4'],
    correct_index: 1,
    explanation: '"Python" has 6 characters.',
  },
  {
    id: 'py-str-05',
    language: 'Python',
    topic: 'strings',
    difficulty: 'medium',
    prompt: 'What does `"hello"[::-1]` produce?',
    choices: ['hello', 'olleh', 'hllo', 'Error'],
    correct_index: 1,
    explanation: '`[::-1]` reverses the string using step -1.',
  },
  {
    id: 'py-str-06',
    language: 'Python',
    topic: 'strings',
    difficulty: 'medium',
    prompt: 'Which f-string correctly formats a float `x=3.14159` to 2 decimal places?',
    choices: ['f"{x:.2f}"', 'f"{x:2f}"', 'f"{x|2f}"', 'f"{x,2f}"'],
    correct_index: 0,
    explanation: '`:.2f` in an f-string specifies 2 decimal places for a float.',
  },
  {
    id: 'py-str-07',
    language: 'Python',
    topic: 'strings',
    difficulty: 'medium',
    prompt: 'What does `"abc" * 3` produce?',
    choices: ['abcabcabc', 'abc3', 'abc abc abc', 'Error'],
    correct_index: 0,
    explanation: 'String multiplication repeats the string n times.',
  },
  {
    id: 'py-str-08',
    language: 'Python',
    topic: 'strings',
    difficulty: 'medium',
    prompt: 'What is `"Hello, World!".find("World")`?',
    choices: ['0', '7', '6', '-1'],
    correct_index: 1,
    explanation: '"World" starts at index 7 in the string.',
  },
  {
    id: 'py-str-09',
    language: 'Python',
    topic: 'strings',
    difficulty: 'hard',
    prompt: 'What does `",".join(["a", "b", "c"])` return?',
    choices: ['a,b,c', '[a,b,c]', 'a b c', '"a","b","c"'],
    correct_index: 0,
    explanation: '`join` concatenates list elements with the separator between each.',
  },
  {
    id: 'py-str-10',
    language: 'Python',
    topic: 'strings',
    difficulty: 'hard',
    prompt: 'Python strings are __________.',
    choices: ['mutable', 'immutable', 'partially mutable', 'weakly typed'],
    correct_index: 1,
    explanation: 'Python strings are immutable — once created, their content cannot be changed in-place.',
  },

  // ─── Python + OOP ───────────────────────────────────────────────────────────

  {
    id: 'py-oop-01',
    language: 'Python',
    topic: 'OOP',
    difficulty: 'easy',
    prompt: 'What keyword is used to define a class in Python?',
    choices: ['def', 'struct', 'class', 'object'],
    correct_index: 2,
    explanation: '`class` is the keyword for defining a class in Python.',
  },
  {
    id: 'py-oop-02',
    language: 'Python',
    topic: 'OOP',
    difficulty: 'easy',
    prompt: 'What is `self` in a Python class method?',
    choices: [
      'A global variable',
      'A reference to the class itself',
      'A reference to the current instance',
      'A built-in keyword',
    ],
    correct_index: 2,
    explanation: '`self` refers to the instance that invoked the method.',
  },
  {
    id: 'py-oop-03',
    language: 'Python',
    topic: 'OOP',
    difficulty: 'easy',
    prompt: 'Which method is called automatically when an object is created?',
    choices: ['__del__', '__init__', '__new__', '__create__'],
    correct_index: 1,
    explanation: '`__init__` is the initializer/constructor called after object creation.',
  },
  {
    id: 'py-oop-04',
    language: 'Python',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'How does Python indicate a "private" attribute by convention?',
    choices: ['private keyword', 'Single underscore prefix _x', 'Double underscore prefix __x', 'Using @private decorator'],
    correct_index: 1,
    explanation: 'By convention, a single leading underscore `_x` signals "private". Double underscore triggers name mangling.',
  },
  {
    id: 'py-oop-05',
    language: 'Python',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'What does `super().__init__()` do inside a child class?',
    choices: [
      'Creates a new parent class',
      'Calls the parent class constructor',
      'Deletes the parent instance',
      'Overrides the parent __init__',
    ],
    correct_index: 1,
    explanation: '`super().__init__()` delegates to the parent class\'s `__init__`.',
  },
  {
    id: 'py-oop-06',
    language: 'Python',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'Which OOP principle does Python\'s method overriding implement?',
    choices: ['Encapsulation', 'Abstraction', 'Polymorphism', 'Composition'],
    correct_index: 2,
    explanation: 'Method overriding is a form of polymorphism — same interface, different behaviour.',
  },
  {
    id: 'py-oop-07',
    language: 'Python',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'What decorator turns a method into a class method?',
    choices: ['@staticmethod', '@classmethod', '@property', '@abstractmethod'],
    correct_index: 1,
    explanation: '`@classmethod` makes the first argument the class (`cls`) instead of an instance.',
  },
  {
    id: 'py-oop-08',
    language: 'Python',
    topic: 'OOP',
    difficulty: 'hard',
    prompt: 'In Python\'s MRO (Method Resolution Order), which algorithm is used?',
    choices: ['Depth-First Search', 'Breadth-First Search', 'C3 Linearization', 'Topological Sort'],
    correct_index: 2,
    explanation: 'Python uses the C3 Linearization algorithm to compute MRO for multiple inheritance.',
  },
  {
    id: 'py-oop-09',
    language: 'Python',
    topic: 'OOP',
    difficulty: 'hard',
    prompt: 'What is the purpose of `__slots__` in a Python class?',
    choices: [
      'Restricts attribute names to save memory',
      'Enables multiple inheritance',
      'Makes all attributes read-only',
      'Provides default values for attributes',
    ],
    correct_index: 0,
    explanation: '`__slots__` restricts which attributes an instance can have, reducing memory overhead.',
  },
  {
    id: 'py-oop-10',
    language: 'Python',
    topic: 'OOP',
    difficulty: 'hard',
    prompt: 'What does the `@property` decorator do?',
    choices: [
      'Creates a class-level variable',
      'Allows a method to be accessed like an attribute',
      'Makes the method private',
      'Prevents method overriding',
    ],
    correct_index: 1,
    explanation: '`@property` lets you define getter logic accessed via `obj.attr` syntax.',
  },

  // ─── JavaScript + Arrays ────────────────────────────────────────────────────

  {
    id: 'js-arr-01',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'easy',
    prompt: 'Which method adds one or more elements to the END of a JS array and returns new length?',
    choices: ['push()', 'pop()', 'shift()', 'unshift()'],
    correct_index: 0,
    explanation: '`push()` appends elements to the end and returns the new array length.',
  },
  {
    id: 'js-arr-02',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'easy',
    prompt: 'What does `[1,2,3].length` return?',
    choices: ['2', '3', '4', 'undefined'],
    correct_index: 1,
    explanation: 'The `length` property of an array returns the number of elements.',
  },
  {
    id: 'js-arr-03',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'easy',
    prompt: 'Which method removes and returns the FIRST element of an array?',
    choices: ['pop()', 'push()', 'shift()', 'unshift()'],
    correct_index: 2,
    explanation: '`shift()` removes the first element from an array and returns it.',
  },
  {
    id: 'js-arr-04',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'What does `[1,2,3].map(x => x * 2)` return?',
    choices: ['[1,2,3]', '[2,4,6]', '[3,6,9]', 'undefined'],
    correct_index: 1,
    explanation: '`map()` transforms each element; `x * 2` doubles every element.',
  },
  {
    id: 'js-arr-05',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'What does `[1,2,3,4,5].filter(x => x % 2 === 0)` produce?',
    choices: ['[1,3,5]', '[2,4]', '[1,2,3,4,5]', '[]'],
    correct_index: 1,
    explanation: '`filter()` keeps elements where the callback returns true; even numbers are 2 and 4.',
  },
  {
    id: 'js-arr-06',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'What is the result of `[1,2,3].reduce((acc, v) => acc + v, 0)`?',
    choices: ['0', '3', '6', '123'],
    correct_index: 2,
    explanation: '`reduce` accumulates: 0+1=1, 1+2=3, 3+3=6.',
  },
  {
    id: 'js-arr-07',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'Which method creates a SHALLOW copy of part of an array?',
    choices: ['splice()', 'slice()', 'split()', 'copy()'],
    correct_index: 1,
    explanation: '`slice()` returns a shallow copy of a portion of an array.',
  },
  {
    id: 'js-arr-08',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'hard',
    prompt: 'What does `[1, [2, [3]]].flat(Infinity)` return?',
    choices: ['[1,[2,[3]]]', '[1,2,[3]]', '[1,2,3]', 'Error'],
    correct_index: 2,
    explanation: '`flat(Infinity)` recursively flattens to any depth.',
  },
  {
    id: 'js-arr-09',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'hard',
    prompt: 'What is the output of `[..."hello"]`?',
    choices: ['["hello"]', '["h","e","l","l","o"]', '"hello"', 'Error'],
    correct_index: 1,
    explanation: 'Spread operator on a string creates an array of individual characters.',
  },
  {
    id: 'js-arr-10',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'hard',
    prompt: 'What does `Array.from({length: 3}, (_, i) => i*i)` return?',
    choices: ['[0,1,2]', '[0,1,4]', '[1,4,9]', 'Error'],
    correct_index: 1,
    explanation: '`Array.from` with a map function; `i` takes values 0, 1, 2 so squares are 0, 1, 4.',
  },

  // ─── JavaScript + Strings ───────────────────────────────────────────────────

  {
    id: 'js-str-01',
    language: 'JavaScript',
    topic: 'strings',
    difficulty: 'easy',
    prompt: 'How do you get the LENGTH of a string in JavaScript?',
    choices: ['str.size()', 'str.length', 'str.count()', 'len(str)'],
    correct_index: 1,
    explanation: '`str.length` is a property (not a method) that returns the character count.',
  },
  {
    id: 'js-str-02',
    language: 'JavaScript',
    topic: 'strings',
    difficulty: 'easy',
    prompt: 'What does `"Hello".toLowerCase()` return?',
    choices: ['Hello', 'HELLO', 'hello', 'hELLO'],
    correct_index: 2,
    explanation: '`toLowerCase()` converts all characters to lowercase.',
  },
  {
    id: 'js-str-03',
    language: 'JavaScript',
    topic: 'strings',
    difficulty: 'easy',
    prompt: 'Which method checks if a string STARTS with a given substring?',
    choices: ['includes()', 'startsWith()', 'indexOf()', 'charAt()'],
    correct_index: 1,
    explanation: '`startsWith()` returns true if the string begins with the specified substring.',
  },
  {
    id: 'js-str-04',
    language: 'JavaScript',
    topic: 'strings',
    difficulty: 'medium',
    prompt: 'What does `"a,b,c".split(",")` return?',
    choices: ['["a,b,c"]', '["a","b","c"]', '"a" "b" "c"', 'Error'],
    correct_index: 1,
    explanation: '`split(",")` splits the string at each comma, returning an array.',
  },
  {
    id: 'js-str-05',
    language: 'JavaScript',
    topic: 'strings',
    difficulty: 'medium',
    prompt: 'What is the output of `` `Hello, ${"World"}!` ``?',
    choices: ['Hello, ${World}!', 'Hello, World!', '"Hello, World!"', 'Error'],
    correct_index: 1,
    explanation: 'Template literals evaluate expressions inside `${}` and interpolate them.',
  },
  {
    id: 'js-str-06',
    language: 'JavaScript',
    topic: 'strings',
    difficulty: 'medium',
    prompt: 'What does `"JavaScript".slice(4, 10)` return?',
    choices: ['Script', 'avaScr', 'Script!', 'Script '],
    correct_index: 0,
    explanation: 'slice(4,10) extracts characters at indices 4 through 9: "Script".',
  },
  {
    id: 'js-str-07',
    language: 'JavaScript',
    topic: 'strings',
    difficulty: 'medium',
    prompt: 'What does `"  hello  ".trim()` return?',
    choices: ['  hello  ', '"hello"', 'hello', 'Error'],
    correct_index: 2,
    explanation: '`trim()` removes leading and trailing whitespace.',
  },
  {
    id: 'js-str-08',
    language: 'JavaScript',
    topic: 'strings',
    difficulty: 'hard',
    prompt: 'What does `"abc".repeat(3)` return?',
    choices: ['abc3', 'abcabcabc', 'abc abc abc', 'Error'],
    correct_index: 1,
    explanation: '`repeat(n)` returns the string repeated n times.',
  },
  {
    id: 'js-str-09',
    language: 'JavaScript',
    topic: 'strings',
    difficulty: 'hard',
    prompt: 'What does `"Hello World".replace(/o/g, "0")` return?',
    choices: ['Hell0 World', 'Hello W0rld', 'Hell0 W0rld', 'Hello World'],
    correct_index: 2,
    explanation: 'The `/g` flag replaces ALL occurrences of "o" with "0".',
  },
  {
    id: 'js-str-10',
    language: 'JavaScript',
    topic: 'strings',
    difficulty: 'hard',
    prompt: 'Are JavaScript strings mutable?',
    choices: [
      'Yes, you can change individual characters',
      'No, strings are immutable',
      'Only in strict mode',
      'Only template literals are immutable',
    ],
    correct_index: 1,
    explanation: 'JavaScript strings are immutable; operations return new strings.',
  },

  // ─── JavaScript + Closures ──────────────────────────────────────────────────

  {
    id: 'js-cls-01',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'easy',
    prompt: 'A closure in JavaScript is a function that has access to its __________.',
    choices: ['global scope only', 'outer function\'s variables', 'prototype chain', 'arguments object'],
    correct_index: 1,
    explanation: 'A closure "closes over" the variables of its enclosing (outer) function.',
  },
  {
    id: 'js-cls-02',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'easy',
    prompt: 'What does the following return?\n```js\nfunction outer() {\n  let x = 10;\n  return function() { return x; };\n}\nouter()();\n```',
    choices: ['undefined', 'null', '10', 'Error'],
    correct_index: 2,
    explanation: 'The inner function closes over `x`, which is 10.',
  },
  {
    id: 'js-cls-03',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'medium',
    prompt: 'What will `arr[0]()` print?\n```js\nvar arr = [];\nfor (var i = 0; i < 3; i++) {\n  arr.push(function() { return i; });\n}\n```',
    choices: ['0', '1', '2', '3'],
    correct_index: 3,
    explanation: '`var` is function-scoped; by the time any callback runs, i is 3.',
  },
  {
    id: 'js-cls-04',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'medium',
    prompt: 'How can you fix the classic loop-closure bug with `var`?',
    choices: ['Use `var` with IIFE', 'Replace `var` with `let`', 'Use global variable', 'Use `const` for i'],
    correct_index: 1,
    explanation: '`let` is block-scoped, so each loop iteration creates a new binding for `i`.',
  },
  {
    id: 'js-cls-05',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'medium',
    prompt: 'What pattern uses a closure to create private variables?\n```js\nconst counter = (function() {\n  let count = 0;\n  return { inc: () => ++count, get: () => count };\n})();\n```',
    choices: ['Factory pattern', 'Observer pattern', 'Module pattern (IIFE)', 'Singleton pattern'],
    correct_index: 2,
    explanation: 'This is the IIFE Module pattern: it uses a closure to make `count` private.',
  },
  {
    id: 'js-cls-06',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'medium',
    prompt: 'What does a closure capture — the VALUE or the REFERENCE to a variable?',
    choices: ['Always the value', 'Always the reference', 'It depends on const vs let', 'Closures do not capture variables'],
    correct_index: 1,
    explanation: 'Closures capture the variable (by reference), not a snapshot of its value.',
  },
  {
    id: 'js-cls-07',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'hard',
    prompt: 'What is the output?\n```js\nfunction make(n) { return x => x + n; }\nconst add5 = make(5);\nconsole.log(add5(3));\n```',
    choices: ['3', '5', '8', 'NaN'],
    correct_index: 2,
    explanation: '`add5` closes over `n=5`. `add5(3)` returns 3+5=8.',
  },
  {
    id: 'js-cls-08',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'hard',
    prompt: 'What potential issue can arise from holding closures in long-lived objects?',
    choices: ['Stack overflow', 'Memory leak due to retained references', 'Prototype pollution', 'Hoisting errors'],
    correct_index: 1,
    explanation: 'Closures retain references to their outer scope, which can prevent garbage collection.',
  },
  {
    id: 'js-cls-09',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'hard',
    prompt: 'What is currying in the context of closures?',
    choices: [
      'Calling a function immediately',
      'Transforming a multi-arg function into a chain of single-arg functions',
      'Caching function results',
      'Binding `this` to a function',
    ],
    correct_index: 1,
    explanation: 'Currying converts `f(a, b)` into `f(a)(b)` using closures to remember earlier arguments.',
  },
  {
    id: 'js-cls-10',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'hard',
    prompt: 'What technique uses a closure to cache expensive function results?',
    choices: ['Debouncing', 'Throttling', 'Memoization', 'Currying'],
    correct_index: 2,
    explanation: 'Memoization stores results in a closure-bound cache, returning cached values on repeat calls.',
  },

  // ─── Java + OOP ─────────────────────────────────────────────────────────────

  {
    id: 'java-oop-01',
    language: 'Java',
    topic: 'OOP',
    difficulty: 'easy',
    prompt: 'Which keyword is used to inherit a class in Java?',
    choices: ['implements', 'extends', 'inherits', 'super'],
    correct_index: 1,
    explanation: '`extends` is used for class inheritance in Java.',
  },
  {
    id: 'java-oop-02',
    language: 'Java',
    topic: 'OOP',
    difficulty: 'easy',
    prompt: 'What access modifier makes a member accessible ONLY within its class?',
    choices: ['public', 'protected', 'default', 'private'],
    correct_index: 3,
    explanation: '`private` restricts access to within the declaring class only.',
  },
  {
    id: 'java-oop-03',
    language: 'Java',
    topic: 'OOP',
    difficulty: 'easy',
    prompt: 'Which keyword prevents a class from being subclassed in Java?',
    choices: ['static', 'abstract', 'final', 'sealed'],
    correct_index: 2,
    explanation: '`final` on a class prevents subclassing.',
  },
  {
    id: 'java-oop-04',
    language: 'Java',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'What is the difference between an abstract class and an interface in Java 8+?',
    choices: [
      'Abstract classes can have constructors; interfaces cannot',
      'Interfaces can have state; abstract classes cannot',
      'Abstract classes support multiple inheritance',
      'There is no difference',
    ],
    correct_index: 0,
    explanation: 'Abstract classes can have constructors and instance fields; interfaces cannot have constructors.',
  },
  {
    id: 'java-oop-05',
    language: 'Java',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'What does the `@Override` annotation do?',
    choices: [
      'Creates a new method',
      'Signals compiler to verify the method overrides a superclass method',
      'Makes the method final',
      'Generates documentation',
    ],
    correct_index: 1,
    explanation: '`@Override` instructs the compiler to confirm the method truly overrides one from a superclass/interface.',
  },
  {
    id: 'java-oop-06',
    language: 'Java',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'Which OOP concept allows a reference to a parent class to hold a child class object?',
    choices: ['Encapsulation', 'Polymorphism', 'Abstraction', 'Composition'],
    correct_index: 1,
    explanation: 'Polymorphism via Liskov Substitution: a parent reference can point to a child object.',
  },
  {
    id: 'java-oop-07',
    language: 'Java',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'What happens if you don\'t explicitly call `super()` in a child constructor?',
    choices: [
      'Compiler error',
      'Parent default constructor is called automatically',
      'No constructor is called',
      'NullPointerException at runtime',
    ],
    correct_index: 1,
    explanation: 'Java implicitly inserts `super()` if no explicit super call exists and the parent has a no-arg constructor.',
  },
  {
    id: 'java-oop-08',
    language: 'Java',
    topic: 'OOP',
    difficulty: 'hard',
    prompt: 'Can a Java interface have a `static` method?',
    choices: ['No, never', 'Yes, since Java 8', 'Yes, but only abstract ones', 'Yes, since Java 5'],
    correct_index: 1,
    explanation: 'Java 8 introduced static methods in interfaces; they are not inherited by implementing classes.',
  },
  {
    id: 'java-oop-09',
    language: 'Java',
    topic: 'OOP',
    difficulty: 'hard',
    prompt: 'What is method hiding in Java?',
    choices: [
      'Making a method private',
      'A static method in a subclass with the same signature as a parent static method',
      'Overriding a final method',
      'Declaring a method without a body',
    ],
    correct_index: 1,
    explanation: 'When a subclass declares a static method with the same signature, it hides (not overrides) the parent static method.',
  },
  {
    id: 'java-oop-10',
    language: 'Java',
    topic: 'OOP',
    difficulty: 'hard',
    prompt: 'What design pattern does `java.lang.Runtime.getRuntime()` demonstrate?',
    choices: ['Factory', 'Observer', 'Singleton', 'Decorator'],
    correct_index: 2,
    explanation: '`Runtime.getRuntime()` returns the single Runtime instance — the Singleton pattern.',
  },

  // ─── Java + Arrays ──────────────────────────────────────────────────────────

  {
    id: 'java-arr-01',
    language: 'Java',
    topic: 'arrays',
    difficulty: 'easy',
    prompt: 'How do you declare an integer array of size 5 in Java?',
    choices: ['int arr[5];', 'int[] arr = new int[5];', 'int arr = new int(5);', 'array<int> arr(5);'],
    correct_index: 1,
    explanation: 'Java syntax: `int[] arr = new int[5];` allocates an int array of length 5.',
  },
  {
    id: 'java-arr-02',
    language: 'Java',
    topic: 'arrays',
    difficulty: 'easy',
    prompt: 'What is the default value of elements in a newly created Java `int[]` array?',
    choices: ['null', '1', '-1', '0'],
    correct_index: 3,
    explanation: 'Java initializes numeric array elements to 0 by default.',
  },
  {
    id: 'java-arr-03',
    language: 'Java',
    topic: 'arrays',
    difficulty: 'easy',
    prompt: 'Which property gives you the length of a Java array `arr`?',
    choices: ['arr.size()', 'arr.length()', 'arr.length', 'arr.count'],
    correct_index: 2,
    explanation: '`arr.length` is a field (not a method) on Java arrays.',
  },
  {
    id: 'java-arr-04',
    language: 'Java',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'Which method sorts an int array in ascending order in Java?',
    choices: ['Arrays.sort(arr)', 'arr.sort()', 'Collections.sort(arr)', 'Arrays.order(arr)'],
    correct_index: 0,
    explanation: '`Arrays.sort(arr)` uses dual-pivot Quicksort for primitives.',
  },
  {
    id: 'java-arr-05',
    language: 'Java',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'What exception is thrown when accessing an invalid index in a Java array?',
    choices: ['NullPointerException', 'IndexOutOfBoundsException', 'ArrayIndexOutOfBoundsException', 'IllegalArgumentException'],
    correct_index: 2,
    explanation: '`ArrayIndexOutOfBoundsException` is thrown for invalid array indices.',
  },
  {
    id: 'java-arr-06',
    language: 'Java',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'What does `Arrays.copyOfRange(arr, 1, 4)` do for `arr = {10,20,30,40,50}`?',
    choices: ['{10,20,30}', '{20,30,40}', '{20,30,40,50}', '{30,40,50}'],
    correct_index: 1,
    explanation: '`copyOfRange(arr,1,4)` copies elements from index 1 (inclusive) to 4 (exclusive): {20,30,40}.',
  },
  {
    id: 'java-arr-07',
    language: 'Java',
    topic: 'arrays',
    difficulty: 'medium',
    prompt: 'Are Java arrays covariant?',
    choices: [
      'No, arrays are invariant',
      'Yes, String[] is a subtype of Object[]',
      'Only primitive arrays are covariant',
      'Only with generics',
    ],
    correct_index: 1,
    explanation: 'Java arrays are covariant: `String[]` is a subtype of `Object[]`, which can cause ArrayStoreException.',
  },
  {
    id: 'java-arr-08',
    language: 'Java',
    topic: 'arrays',
    difficulty: 'hard',
    prompt: 'What is the time complexity of `Arrays.binarySearch` on a sorted array?',
    choices: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correct_index: 1,
    explanation: 'Binary search repeatedly halves the search space — O(log n).',
  },
  {
    id: 'java-arr-09',
    language: 'Java',
    topic: 'arrays',
    difficulty: 'hard',
    prompt: 'What does `System.arraycopy(src,0,dest,0,3)` do?',
    choices: [
      'Creates a new array of length 3',
      'Copies 3 elements from src[0] to dest[0]',
      'Moves src to dest entirely',
      'Clears the first 3 elements of dest',
    ],
    correct_index: 1,
    explanation: '`System.arraycopy` copies `length` (3) elements starting from `srcPos` (0) of `src` into `dest` at `destPos` (0).',
  },
  {
    id: 'java-arr-10',
    language: 'Java',
    topic: 'arrays',
    difficulty: 'hard',
    prompt: 'What is printed?\n```java\nint[] a = {1,2,3};\nint[] b = a;\nb[0] = 99;\nSystem.out.println(a[0]);\n```',
    choices: ['1', '99', '0', 'Error'],
    correct_index: 1,
    explanation: 'Arrays are reference types; `b = a` copies the reference, so `b[0]=99` also changes `a[0]`.',
  },

  // ─── C++ + Pointers ─────────────────────────────────────────────────────────

  {
    id: 'cpp-ptr-01',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'easy',
    prompt: 'What operator gives you the memory address of a variable in C++?',
    choices: ['*', '&', '->', '::'],
    correct_index: 1,
    explanation: '`&` is the address-of operator; `&x` gives the address of variable x.',
  },
  {
    id: 'cpp-ptr-02',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'easy',
    prompt: 'What operator is used to DEREFERENCE a pointer?',
    choices: ['&', '**', '*', '->'],
    correct_index: 2,
    explanation: '`*ptr` dereferences the pointer, accessing the value at the address it holds.',
  },
  {
    id: 'cpp-ptr-03',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'easy',
    prompt: 'What is a NULL pointer?',
    choices: ['A pointer to address 0', 'An uninitialized pointer', 'A pointer to a null object', 'A pointer with value -1'],
    correct_index: 0,
    explanation: 'A NULL (or nullptr) pointer holds the address value 0, indicating "points to nothing".',
  },
  {
    id: 'cpp-ptr-04',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'medium',
    prompt: 'What is pointer arithmetic? If `int* p = &arr[0]`, what does `*(p+2)` access?',
    choices: ['arr[0]', 'arr[1]', 'arr[2]', 'arr[3]'],
    correct_index: 2,
    explanation: '`p+2` advances by 2 int-sized steps, pointing to `arr[2]`.',
  },
  {
    id: 'cpp-ptr-05',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'medium',
    prompt: 'What is a dangling pointer?',
    choices: [
      'A pointer not yet initialized',
      'A pointer pointing to freed/deallocated memory',
      'A pointer to a null value',
      'A double pointer',
    ],
    correct_index: 1,
    explanation: 'A dangling pointer refers to memory that has been freed, leading to undefined behavior if dereferenced.',
  },
  {
    id: 'cpp-ptr-06',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'medium',
    prompt: 'What does `->` do in C++?',
    choices: [
      'Dereferences a pointer and accesses a member',
      'Returns the address of a member',
      'Compares two pointers',
      'Casts a pointer type',
    ],
    correct_index: 0,
    explanation: '`ptr->member` is shorthand for `(*ptr).member`.',
  },
  {
    id: 'cpp-ptr-07',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'medium',
    prompt: 'What is the size of a pointer on a 64-bit system (in bytes)?',
    choices: ['2', '4', '8', '16'],
    correct_index: 2,
    explanation: 'On 64-bit systems, a pointer is 8 bytes (64 bits) regardless of the type pointed to.',
  },
  {
    id: 'cpp-ptr-08',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'hard',
    prompt: 'What is the preferred C++11 smart pointer for EXCLUSIVE ownership?',
    choices: ['std::shared_ptr', 'std::weak_ptr', 'std::unique_ptr', 'std::auto_ptr'],
    correct_index: 2,
    explanation: '`std::unique_ptr` enforces single ownership and automatically deletes the resource.',
  },
  {
    id: 'cpp-ptr-09',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'hard',
    prompt: 'What problem does `std::weak_ptr` solve?',
    choices: ['Memory fragmentation', 'Cyclic references causing memory leaks with shared_ptr', 'Null pointer dereference', 'Stack overflow'],
    correct_index: 1,
    explanation: '`weak_ptr` breaks `shared_ptr` cyclic references because it does not increase the reference count.',
  },
  {
    id: 'cpp-ptr-10',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'hard',
    prompt: 'What is undefined behavior in C++ when dealing with pointers?',
    choices: [
      'Using nullptr',
      'Dereferencing a null or dangling pointer',
      'Casting int* to void*',
      'Comparing two pointers with ==',
    ],
    correct_index: 1,
    explanation: 'Dereferencing a null or dangling pointer is undefined behavior — anything can happen.',
  },

  // ─── C++ + OOP ──────────────────────────────────────────────────────────────

  {
    id: 'cpp-oop-01',
    language: 'C++',
    topic: 'OOP',
    difficulty: 'easy',
    prompt: 'What are the default access specifiers for members of a `class` in C++?',
    choices: ['public', 'protected', 'private', 'internal'],
    correct_index: 2,
    explanation: 'In C++ `class`, members default to `private` (unlike `struct` which defaults to `public`).',
  },
  {
    id: 'cpp-oop-02',
    language: 'C++',
    topic: 'OOP',
    difficulty: 'easy',
    prompt: 'Which function is automatically called when an object goes out of scope?',
    choices: ['Constructor', 'Destructor', 'Finalizer', 'Dispose'],
    correct_index: 1,
    explanation: 'The destructor (`~ClassName()`) is automatically called when an object\'s lifetime ends.',
  },
  {
    id: 'cpp-oop-03',
    language: 'C++',
    topic: 'OOP',
    difficulty: 'easy',
    prompt: 'What keyword makes a function polymorphic in C++?',
    choices: ['override', 'virtual', 'abstract', 'final'],
    correct_index: 1,
    explanation: '`virtual` enables dynamic dispatch — the correct subclass method is called at runtime.',
  },
  {
    id: 'cpp-oop-04',
    language: 'C++',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'What is the diamond problem in C++ multiple inheritance?',
    choices: [
      'A class with 4 base classes',
      'Ambiguity when two parent classes share a common grandparent',
      'A destructor called 4 times',
      'A memory layout issue',
    ],
    correct_index: 1,
    explanation: 'The diamond problem causes ambiguity about which copy of the grandparent\'s members to use.',
  },
  {
    id: 'cpp-oop-05',
    language: 'C++',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'How does C++ solve the diamond problem?',
    choices: ['Disabling multiple inheritance', 'Using `virtual` inheritance', 'Interfaces only', 'Name mangling'],
    correct_index: 1,
    explanation: '`virtual` base classes ensure only one copy of the grandparent exists in the hierarchy.',
  },
  {
    id: 'cpp-oop-06',
    language: 'C++',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'What is a pure virtual function in C++?',
    choices: [
      'A function with no body, declared with = 0',
      'A function that cannot be overridden',
      'A static virtual function',
      'A virtual constructor',
    ],
    correct_index: 0,
    explanation: 'A pure virtual function (`virtual void f() = 0;`) has no implementation and makes the class abstract.',
  },
  {
    id: 'cpp-oop-07',
    language: 'C++',
    topic: 'OOP',
    difficulty: 'medium',
    prompt: 'What is operator overloading in C++?',
    choices: [
      'Calling an operator multiple times',
      'Defining custom behavior for operators on user-defined types',
      'Overriding arithmetic operators in base class',
      'Using operators with void pointers',
    ],
    correct_index: 1,
    explanation: 'Operator overloading lets you define how operators like `+`, `==`, `<<` work with your classes.',
  },
  {
    id: 'cpp-oop-08',
    language: 'C++',
    topic: 'OOP',
    difficulty: 'hard',
    prompt: 'Why should a base class destructor be `virtual` in C++?',
    choices: [
      'To improve performance',
      'To ensure the derived class destructor is called through a base pointer',
      'To prevent the destructor from being called',
      'To allow multiple destructors',
    ],
    correct_index: 1,
    explanation: 'Without `virtual`, deleting a derived object via a base pointer only calls the base destructor — resource leak.',
  },
  {
    id: 'cpp-oop-09',
    language: 'C++',
    topic: 'OOP',
    difficulty: 'hard',
    prompt: 'What is RAII in C++?',
    choices: [
      'Random Access to Allocated Items',
      'Resource Acquisition Is Initialization',
      'Runtime Allocation and Initialization Interface',
      'Recursive Abstract Interface Implementation',
    ],
    correct_index: 1,
    explanation: 'RAII ties resource management (memory, files, locks) to object lifetime — acquired in constructor, released in destructor.',
  },
  {
    id: 'cpp-oop-10',
    language: 'C++',
    topic: 'OOP',
    difficulty: 'hard',
    prompt: 'What is a vtable in C++?',
    choices: [
      'A table of variable types',
      'A lookup table of virtual function pointers for dynamic dispatch',
      'A virtual base class table',
      'A compile-time function table',
    ],
    correct_index: 1,
    explanation: 'The vtable is a compiler-generated table of pointers to virtual functions, enabling runtime polymorphism.',
  },
];

import { supabaseAdmin } from '../config/supabase.js';

export function normalizeLanguage(lang?: string): string | undefined {
  if (!lang) return undefined;
  const l = lang.toLowerCase();
  if (l === 'cpp' || l === 'c++') return 'C++';
  if (l === 'javascript' || l === 'js') return 'JavaScript';
  if (l === 'python' || l === 'py') return 'Python';
  if (l === 'java') return 'Java';
  if (l === 'c') return 'C';
  return lang;
}

export function normalizeTopic(topic: string): string {
  const clean = topic.replace(/^(Python|JS|Java|CPP|C|DBMS|DSA|OS)-/i, '').toLowerCase();
  
  if (['pointer', 'reference', 'memory', 'dynamic'].some(x => clean.includes(x))) {
    return 'pointers';
  }
  if (['closure', 'scope', 'variable', 'hoisting', 'event', 'callback', 'promise', 'async', 'basics', 'data-types', 'intro'].some(x => clean.includes(x))) {
    return 'closures';
  }
  if (['list', 'tuple', 'set', 'array', 'collection', 'vector', 'search', 'sort', 'tree', 'graph', 'hash', 'heap', 'queue', 'stack', 'keys', 'join', 'index'].some(x => clean.includes(x))) {
    return 'arrays';
  }
  if (['string', 'regex', 'text', 'char'].some(x => clean.includes(x))) {
    return 'strings';
  }
  if (['oop', 'class', 'object', 'inherit', 'poly', 'encap', 'abstract', 'model', 'relation', 'normalization', 'transaction', 'acid', 'lock', 'deadlock'].some(x => clean.includes(x))) {
    return 'OOP';
  }
  
  return 'arrays';
}

/**
 * Filter questions locally by language and/or topic.
 */
export function getQuestionsLocal(language?: string, topics?: string[]): Question[] {
  const normLang = normalizeLanguage(language);
  const normTopics = topics ? topics.map(t => normalizeTopic(t)) : [];
  return questions.filter(q => {
    const langMatch = !normLang || q.language === normLang;
    const topicMatch = !topics || topics.length === 0 || normTopics.includes(normalizeTopic(q.topic));
    return langMatch && topicMatch;
  });
}

/**
 * Pick `count` random questions locally.
 */
export function pickQuestionsLocal(language: string, topics: string[], count: number): Question[] {
  const normLang = normalizeLanguage(language);
  const pool = getQuestionsLocal(normLang, topics);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  return selected.map(q => shuffleQuestionChoices(q));
}

function shuffleQuestionChoices(q: Question): Question {
  const choices = [...q.choices];
  const correctChoice = choices[q.correct_index];

  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = choices[i]!;
    choices[i] = choices[j]!;
    choices[j] = temp;
  }

  const newCorrectIndex = choices.indexOf(correctChoice);
  return {
    ...q,
    choices: choices as [string, string, string, string],
    correct_index: newCorrectIndex === -1 ? 0 : (newCorrectIndex as 0 | 1 | 2 | 3)
  };
}

/**
 * Fetch and filter questions from the database.
 */
export async function getQuestions(language?: string, topics?: string[], gameMode?: string): Promise<Question[]> {
  const normLang = normalizeLanguage(language);

  // 1. Try querying standard schema
  try {
    let query = supabaseAdmin.database
      .from('questions')
      .select('id, language, topic, difficulty, prompt, choices, correct_index, explanation');

    if (normLang) {
      query = query.eq('language', normLang);
    }
    if (topics && topics.length > 0) {
      query = query.in('topic', topics);
    }
    
    if (gameMode === 'snippets') {
      query = query.like('id', 'snip-%');
    } else {
      query = query.not('id', 'like', 'snip-%');
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as unknown as Question[];
    }
    if (error) {
      console.warn('[getQuestions] Standard schema query failed:', error.message);
    }
  } catch (err: any) {
    console.warn('[getQuestions] Standard schema query exception:', err?.message || err);
  }

  // 2. Try querying legacy schema
  try {
    let query = supabaseAdmin.database
      .from('questions')
      .select('id, category, topic, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer');

    if (normLang) {
      query = query.eq('category', normLang.toLowerCase());
    }
    
    if (topics && topics.length > 0) {
      const normTopics = topics.map(t => normalizeTopic(t));
      const topicFilters = [...topics, ...normTopics];
      query = query.in('topic', topicFilters);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((q: any) => {
        const choices: [string, string, string, string] = [
          q.option_a || '',
          q.option_b || '',
          q.option_c || '',
          q.option_d || ''
        ];
        const correctMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
        const correct_index = correctMap[String(q.correct_answer).toUpperCase()] ?? 0;

        return {
          id: String(q.id),
          language: normLang || q.category || 'JavaScript',
          topic: q.topic || 'arrays',
          difficulty: q.difficulty || 'medium',
          prompt: q.question_text || '',
          choices,
          correct_index: correct_index as 0 | 1 | 2 | 3,
          explanation: q.explanation || 'No explanation provided.'
        };
      });
    }
    if (error) {
      console.warn('[getQuestions] Legacy schema query failed:', error.message);
    }
  } catch (err: any) {
    console.warn('[getQuestions] Legacy schema query exception:', err?.message || err);
  }

  // 3. Fallback to local questions
  console.log('[getQuestions] Falling back to local question bank.');
  return getQuestionsLocal(language, topics);
}

/**
 * Pick `count` random questions from the database, scaling progressively from medium to extra-hard.
 * Ensures no repeats within the selected array. Dummy/easy questions are explicitly filtered out.
 */
export async function pickQuestions(language: string, topics: string[], count: number, gameMode?: string): Promise<Question[]> {
  try {
    const rawPool = await getQuestions(language, topics, gameMode);
    
    // Filter out dummy/easy questions completely
    const validPool = rawPool.filter(q => q.difficulty && q.difficulty !== 'easy');
    
    if (validPool.length === 0) {
      console.warn('[pickQuestions] No valid difficult questions found, falling back to raw pool.');
      const shuffled = [...rawPool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, shuffled.length)).map(q => shuffleQuestionChoices(q));
    }

    // Separate into difficulty buckets
    let mediumPool = validPool.filter(q => q.difficulty === 'medium');
    let hardPool = validPool.filter(q => q.difficulty === 'hard');
    let extraHardPool = validPool.filter(q => q.difficulty === 'extra-hard');

    // Shuffle each pool independently
    mediumPool.sort(() => Math.random() - 0.5);
    hardPool.sort(() => Math.random() - 0.5);
    extraHardPool.sort(() => Math.random() - 0.5);

    // Calculate strict quotas (33% / 33% / 34%)
    let mediumQuota = Math.floor(count / 3);
    let hardQuota = Math.floor(count / 3);
    let extraHardQuota = count - mediumQuota - hardQuota;

    // Adjust quotas if a pool falls short
    if (mediumPool.length < mediumQuota) {
      hardQuota += (mediumQuota - mediumPool.length);
      mediumQuota = mediumPool.length;
    }
    if (hardPool.length < hardQuota) {
      extraHardQuota += (hardQuota - hardPool.length);
      hardQuota = hardPool.length;
    }
    if (extraHardPool.length < extraHardQuota) {
      // Flow back to hard, then medium if extra-hard is short
      const overflow = extraHardQuota - extraHardPool.length;
      extraHardQuota = extraHardPool.length;
      if (hardPool.length - hardQuota >= overflow) {
        hardQuota += overflow;
      } else {
        const remainingOverflow = overflow - (hardPool.length - hardQuota);
        hardQuota = hardPool.length;
        mediumQuota += remainingOverflow;
      }
    }

    // Select the slices strictly without replacement
    const selectedMedium = mediumPool.slice(0, mediumQuota);
    const selectedHard = hardPool.slice(0, hardQuota);
    const selectedExtraHard = extraHardPool.slice(0, extraHardQuota);

    // Concatenate in strict progression order: Medium -> Hard -> Extra-Hard
    const selected = [...selectedMedium, ...selectedHard, ...selectedExtraHard];

    // If we still fall short (very rare), just pad with whatever is left randomly
    if (selected.length < count) {
      const selectedIds = new Set(selected.map(q => q.id));
      const remaining = validPool.filter(q => !selectedIds.has(q.id)).sort(() => Math.random() - 0.5);
      selected.push(...remaining.slice(0, count - selected.length));
    }

    return selected.map(q => shuffleQuestionChoices(q));
  } catch (err) {
    console.error('[pickQuestions] Catch error:', err);
    return pickQuestionsLocal(language, topics, count);
  }
}

/**
 * Pick `count` high-difficulty questions (hard/extra-hard) for tie-breaker phase.
 */
export async function pickTieBreakerQuestions(language: string, topics: string[], count: number, gameMode?: string): Promise<Question[]> {
  try {
    const pool = await getQuestions(language, topics, gameMode);
    let filtered = pool.filter(q => q.difficulty === 'hard' || q.difficulty === 'extra-hard');
    if (filtered.length < count) {
      filtered = pool;
    }
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    return selected.map(q => shuffleQuestionChoices(q));
  } catch (err) {
    console.error('[pickTieBreakerQuestions] Catch error:', err);
    return pickQuestionsLocal(language, topics, count);
  }
}

