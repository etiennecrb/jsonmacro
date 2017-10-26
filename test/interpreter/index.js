const test = require('tape');

const { compile } = require('../../dist/jsonmacro.compiler');
const { run } = require('../../dist/jsonmacro.interpreter');

const input = `
    a = 1 + 1
    if a then
      for each i in [1, 2, 3] do
        addToTotal(a + i)
        print(i)
      end
    end
`;

const options = {
  func: {
    addToTotal: (int, context) => (context.total = (context.total || 0) + int),
    print: s => console.log(s)
  }
};
const jsonm = compile(input);
console.log('%j', jsonm);
const context = run(jsonm, options);
console.log('%j', context);
