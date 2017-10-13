const fs = require('fs');
const peg = require('pegjs');
const test = require('tape');

const grammar = fs.readFileSync('./jsonscript.pegjs', 'utf-8');

const parser = peg.generate(grammar);

test('Parser output type', t => {
    t.deepEqual(parser.parse(''), []);
    t.deepEqual(parser.parse('  \n \r'), []);
    t.end();
});

test('Number parsing', t => {
    t.deepEqual(parser.parse('a = 8'), [{'=': [{'var': ['a']}, 8]}]);
    t.deepEqual(parser.parse('a = 8.2'), [{'=': [{'var': ['a']}, 8.2]}]);
    t.deepEqual(parser.parse('a = .2'), [{'=': [{'var': ['a']}, 0.2]}]);
    t.deepEqual(parser.parse('a = -2'), [{'=': [{'var': ['a']}, -2]}]);
    t.deepEqual(parser.parse('a = 1--2'), [{'=': [{'var': ['a']}, {'-': [1, -2]}]}]);
    t.deepEqual(parser.parse('a =  8  '), [{'=': [{'var': ['a']}, 8]}]);
    t.deepEqual(parser.parse('a = (8)'), [{'=': [{'var': ['a']}, 8]}]);
    t.deepEqual(parser.parse('a = ( 8   )'), [{'=': [{'var': ['a']}, 8]}]);
    t.end();
});

test('String parsing', t => {
    t.deepEqual(parser.parse('a = "anything"'), [{'=': [{'var': ['a']}, 'anything']}]);
    t.deepEqual(parser.parse('a = "this is a string"'), [{'=': [{'var': ['a']}, 'this is a string']}]);
    t.end();
});

test('Sum parsing', t => {
    t.deepEqual(parser.parse('a = 8 + 2'), [{'=': [{'var': ['a']}, {'+': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = 8+2'), [{'=': [{'var': ['a']}, {'+': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = (8-(2)) '), [{'=': [{'var': ['a']}, {'-': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = 8+2-1'), [{'=': [{'var': ['a']}, {'-': [{'+': [8, 2]}, 1]}]}]);
    t.end();
});

test('Product parsing', t => {
    t.deepEqual(parser.parse('a = 8 * 2'), [{'=': [{'var': ['a']}, {'*': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = 8*2'), [{'=': [{'var': ['a']}, {'*': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = (8/(2)) '), [{'=': [{'var': ['a']}, {'/': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = 8*2/1'), [{'=': [{'var': ['a']}, {'/': [{'*': [8, 2]}, 1]}]}]);
    t.end();
});

test('Operation priority', t => {
    t.deepEqual(parser.parse('a = 8 * 2 + 1'), [{'=': [{'var': ['a']}, {'+': [{'*': [8, 2]}, 1]}]}]);
    t.deepEqual(parser.parse('a = 8 * (2 + 1)'), [{'=': [{'var': ['a']}, {'*': [8, {'+': [2, 1]}]}]}]);
    t.deepEqual(parser.parse('a = (8+1) * ((2 * 1) + 9)'), [{'=': [{'var': ['a']}, {'*': [{'+': [8, 1]}, {'+': [{'*': [2, 1]}, 9]}]}]}]);
    t.end();
});

test('Array parsing', t => {
    t.deepEqual(parser.parse('a = [8]'), [{'=': [{'var': ['a']}, [8]]}]);
    t.deepEqual(parser.parse('a = [8+2, myVar]'), [{'=': [{'var': ['a']}, [{'+': [8, 2]}, {'var': ['myVar']}]]}]);
    t.end();
});

test('OR parsing', t => {
    t.deepEqual(parser.parse('a = 8 or 2'), [{'=': [{'var': ['a']}, {'or': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = 8 or 2 or 1'), [{'=': [{'var': ['a']}, {'or': [{'or': [8, 2]}, 1]}]}]);
    t.end();
});

test('AND parsing', t => {
    t.deepEqual(parser.parse('a = 8 and 2'), [{'=': [{'var': ['a']}, {'and': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = 8 and 2 and 1'), [{'=': [{'var': ['a']}, {'and': [{'and': [8, 2]}, 1]}]}]);
    t.end();
});

test('Operation priority', t => {
    t.deepEqual(parser.parse('a = 8 and 2 or 1'), [{'=': [{'var': ['a']}, {'or': [{'and': [8, 2]}, 1]}]}]);
    t.deepEqual(parser.parse('a = 8 and (2 or 1)'), [{'=': [{'var': ['a']}, {'and': [8, {'or': [2, 1]}]}]}]);
    t.deepEqual(parser.parse('a = (8 or 1) and ((2 and 1) or 9)'), [{'=': [{'var': ['a']}, {'and': [{'or': [8, 1]}, {'or': [{'and': [2, 1]}, 9]}]}]}]);
    t.end();
});

test('Relation parsing', t => {
    t.deepEqual(parser.parse('a = 8 <= 2'), [{'=': [{'var': ['a']}, {'<=': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = 8 > 2'), [{'=': [{'var': ['a']}, {'>': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = 8 != 2'), [{'=': [{'var': ['a']}, {'!=': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = 8 == 2'), [{'=': [{'var': ['a']}, {'==': [8, 2]}]}]);
    t.deepEqual(parser.parse('a = 8 > 2 and 1 == 1'), [{'=': [{'var': ['a']}, {'and': [{'>': [8, 2]}, {'==': [1, 1]}]}]}]);
    t.end();
});

test('Complex expression parsing', t => {
    t.deepEqual(parser.parse('a = 8 + 2 * 3 != 2>8 or 1 and 2'), [
        {'=': [{'var': ['a']}, {'or': [
            {'!=': [
                {'+': [8, {'*': [2, 3]}]},
                {'>': [2, 8]}
            ]},
            {'and': [1, 2]}
        ]}]}
    ]);
    t.end();
});

test('Function call', t => {
    t.deepEqual(parser.parse('myFunc()'), [{'func': ['myFunc', []]}]);
    t.end();
});

test('Variable assignment', t => {
    t.deepEqual(parser.parse('myVar = 2'), [{'=': [{'var': ['myVar']}, 2]}]);
    t.deepEqual(parser.parse('myVar = 1 < 9 and myBoolean(myArg)'), [
        {'=': [{'var': ['myVar']}, {'and': [{'<': [1, 9]}, {'func': ['myBoolean', [{'var': ['myArg']}]]}]}]}
        ]);
    t.end();
});

test('Variable, properties and methods parsing', t => {
    t.deepEqual(parser.parse('a = myVar'), [{'=': [{'var': ['a']}, {'var': ['myVar']}]}]);
    t.deepEqual(parser.parse('a = myVar.myProp'), [{'=': [{'var': ['a']}, {'property': [{'var': ['myVar']}, 'myProp']}]}]);
    t.deepEqual(parser.parse('a = myVar.myMethod()'), [{'=': [{'var': ['a']}, {'method': [{'var': ['myVar']}, 'myMethod', []]}]}]);
    t.deepEqual(parser.parse('a = myVar.myMethod().myProp'), [{'=': [{'var': ['a']}, {'property': [
        {'method': [{'var': ['myVar']}, 'myMethod', []]}, 'myProp'
    ]}]}]);
    t.deepEqual(parser.parse('a = myVar.myMethod(1, 3 > 2, otherVar)'), [{'=': [{'var': ['a']},
        {'method': [{'var': ['myVar']}, 'myMethod', [1, {'>': [3, 2]}, {'var': ['otherVar']}]]}
    ]}]);
    t.end();
});


test('Complex expression with variable parsing', t => {
    t.deepEqual(parser.parse('a = 8 + myVar_ * 3 != 2>8 or myVar._myBooleanMethod() and 2'), [
        {'=': [{'var': ['a']}, {'or': [
            {'!=': [
                {'+': [8, {'*': [{'var': ['myVar_']}, 3]}]},
                {'>': [2, 8]}
            ]},
            {'and': [{'method': [{'var': ['myVar']}, '_myBooleanMethod', []]}, 2]}
        ]}]}
    ]);
    t.end();
});

test('If then else parsing', t => {
    let s = `
      if a > 8 or a.b == 2 then
        myFunc(a, a.b)
      end
    `;
    t.deepEqual(parser.parse(s), [
        {'if': [
            {'or': [{'>': [{'var': ['a']}, 8]}, {'==': [{'property': [{'var': ['a']}, 'b']}, 2]}]},
            [
                {'func': ['myFunc', [{'var': ['a']}, {'property': [{'var': ['a']}, 'b']}]]}
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
    t.deepEqual(parser.parse(s), [
        {'if': [
            {'or': [{'>': [{'var': ['a']}, 8]}, {'==': [{'property': [{'var': ['a']}, 'b']}, 2]}]},
            [
                {'func': ['myFunc', [{'var': ['a']}, {'property': [{'var': ['a']}, 'b']}]]}
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
    t.deepEqual(parser.parse(s), [
        {'if': [
            {'or': [{'>': [{'var': ['a']}, 8]}, {'==': [{'property': [{'var': ['a']}, 'b']}, 2]}]},
            [
                {'func': ['myFunc', [{'var': ['a']}, {'property': [{'var': ['a']}, 'b']}]]}
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
