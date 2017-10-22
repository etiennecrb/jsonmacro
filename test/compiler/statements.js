const test = require('tape');

const { compile } = require('../../dist/jsonmacro.compiler');

test('Empty strings parsing', t => {
    t.deepEqual(compile(''), [], 'it should return an empty array if parsing the empty string');
    t.deepEqual(compile('  \n \r'), [], 'it should return an empty array if parsing a string with only whitespaces');
    t.end();
});

test('Variable assignment', t => {
    t.deepEqual(compile('myVar = 2'), [{'=': [{'var': ['myVar']}, 2]}]);
    t.deepEqual(compile('myVar = 1 < 9 and myBoolean(myArg)'), [
        {'=': [{'var': ['myVar']}, {'and': [{'<': [1, 9]}, {'func': ['myBoolean', [{'var': ['myArg']}]]}]}]}
    ]);
    t.end();
});


test('If then else parsing', t => {
    let s = `
      if a > 8 or a.b == 2 then
        myFunc(a, a.b)
      end
    `;
    t.deepEqual(compile(s), [
        {'if': [
            {'or': [{'>': [{'var': ['a']}, 8]}, {'==': [{'prop': [{'var': ['a']}, 'b']}, 2]}]},
            [
                {'func': ['myFunc', [{'var': ['a']}, {'prop': [{'var': ['a']}, 'b']}]]}
            ],
            []
        ]}
    ]);

    s = `
      if a > 8 or a.b == 2 then
        myFunc(a, a.b)
      else
        myOtherFunc()
      end
    `;
    t.deepEqual(compile(s), [
        {'if': [
            {'or': [{'>': [{'var': ['a']}, 8]}, {'==': [{'prop': [{'var': ['a']}, 'b']}, 2]}]},
            [
                {'func': ['myFunc', [{'var': ['a']}, {'prop': [{'var': ['a']}, 'b']}]]}
            ],
            [
                {'func': ['myOtherFunc', []]}
            ]
        ]}
    ]);

    s = `
      if a > 8 or a.b == 2 then
        myFunc(a, a.b)
      else if a == 1 then
        myOtherFunc()
      else
        noop()
      end
    `;
    t.deepEqual(compile(s), [
        {'if': [
            {'or': [{'>': [{'var': ['a']}, 8]}, {'==': [{'prop': [{'var': ['a']}, 'b']}, 2]}]},
            [
                {'func': ['myFunc', [{'var': ['a']}, {'prop': [{'var': ['a']}, 'b']}]]}
            ],
            [
                {'if': [
                    {'==': [{'var': ['a']}, 1]},
                    [{'func': ['myOtherFunc', []]}],
                    [{'func': ['noop', []]}]
                ]}
            ]
        ]}
    ]);
    t.end();
});
