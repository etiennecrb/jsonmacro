const test = require('tape');

const { compile } = require('../../dist/jsonmacro.compiler');
const { rhs, TYPE_VAR, TYPE_FUNC, TYPE_PROP, TYPE_CALL } = require('../utils');

test('Number parsing', t => {
  t.deepEqual(rhs(t, compile('a = 8')), { number: [8] }, 'it should parse one digit integers');
  t.deepEqual(rhs(t, compile('a = 82')), { number: [82] }, 'it should parse any integer');
  t.deepEqual(rhs(t, compile('a = 8.2')), { number: [8.2] }, 'it should parse floats');
  t.deepEqual(
    rhs(t, compile('a = 8.23')),
    { number: [8.23] },
    'it should parse floats with multiple decimal places'
  );
  t.deepEqual(
    rhs(t, compile('a = .2')),
    { number: [0.2] },
    'it should parse floats without leading 0'
  );
  t.deepEqual(
    rhs(t, compile('a = .23')),
    { number: [0.23] },
    'it should parse floats without leading 9 but multiple decimal places'
  );
  t.deepEqual(rhs(t, compile('a = -2')), { number: [-2] }, 'it should parse negative integers');
  t.deepEqual(rhs(t, compile('a = -2.34')), { number: [-2.34] }, 'it should parse negative floats');
  t.deepEqual(rhs(t, compile('a = +25')), { number: [25] }, 'it should parse "+" signed numbers');
  t.throws(
    () => rhs(t, compile('a = --2')),
    undefined,
    'it should throw error if parsing simple number with two consecutive minus signs'
  );
  t.deepEqual(
    rhs(t, compile('a = 1--2')),
    { '-': [{ number: [1] }, { number: [-2] }] },
    'it should parse expression with two consecutive minus signs'
  );
  t.throws(
    () => rhs(t, compile('a = 1-+-2')),
    undefined,
    'it should throw error if parsing expression with more than two consecutive plus or minus signs'
  );
  t.deepEqual(
    rhs(t, compile('a =  8  ')),
    { number: [8] },
    'it should ignore whitespaces around numbers'
  );
  t.deepEqual(
    rhs(t, compile('a=8')),
    { number: [8] },
    'it should manage to parse numbers without whitespaces around'
  );
  t.deepEqual(
    rhs(t, compile('a = (8)')),
    { number: [8] },
    'it should parse numbers inside parentheses'
  );
  t.end();
});

test('String parsing', t => {
  t.deepEqual(
    rhs(t, compile('a = "anything"')),
    { string: ['anything'] },
    'it should parse simple strings'
  );
  t.deepEqual(
    rhs(t, compile('a = "this is a string"')),
    { string: ['this is a string'] },
    'it should parse strings with whitespaces'
  );
  t.deepEqual(rhs(t, compile('a = ""')), { string: [''] }, 'it should parse empty strings');
  t.throws(
    () => rhs(t, compile("a = 'anything'")),
    undefined,
    'it should throw error on single quoted strings'
  );
  t.throws(
    () => rhs(t, compile('a = "a string with a " quote"')),
    undefined,
    'it should throw error on wrongly formatted strings'
  );

  // TODO: make it parse escaped characters
  t.throws(
    () => rhs(t, compile('a = "a string with a " quote"')),
    undefined,
    'it should throw error on escaped double quote'
  );
  t.end();
});

test('Array parsing', t => {
  t.deepEqual(rhs(t, compile('a = []')), { array: [] }, 'it should parse empty arrays');
  t.deepEqual(
    rhs(t, compile('a = [8]')),
    { array: [{ number: [8] }] },
    'it should parse arrays with one element'
  );
  t.deepEqual(
    rhs(t, compile('a = [8, 2]')),
    { array: [{ number: [8] }, { number: [2] }] },
    'it should parse arrays with two elements'
  );
  t.deepEqual(
    rhs(t, compile('a = [8,2,4,5]')),
    {
      array: [{ number: [8] }, { number: [2] }, { number: [4] }, { number: [5] }]
    },
    'it should parse arrays with multiple elements'
  );
  t.deepEqual(
    rhs(
      t,
      compile('a = [8, myVar, myFunc(), "string", (9), myVar.myMethod(), myVar.myProp, [1, 2]]')
    ),
    {
      array: [
        { number: [8] },
        { [TYPE_VAR]: ['myVar'] },
        { [TYPE_FUNC]: ['myFunc', []] },
        { string: ['string'] },
        { number: [9] },
        { [TYPE_CALL]: [{ [TYPE_VAR]: ['myVar'] }, 'myMethod', []] },
        { [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] },
        { array: [{ number: [1] }, { number: [2] }] }
      ]
    },
    'it should parse arrays with elements of any type'
  );
  t.deepEqual(
    rhs(t, compile('a = [8+1, a and b or c]')),
    {
      array: [
        { '+': [{ number: [8] }, { number: [1] }] },
        {
          or: [{ and: [{ [TYPE_VAR]: ['a'] }, { [TYPE_VAR]: ['b'] }] }, { [TYPE_VAR]: ['c'] }]
        }
      ]
    },
    'it should parse arrays with computed elements'
  );
  t.throws(() => rhs(t, compile('a = [1,2,,3]')), undefined, 'it should not allow elisions');
  t.end();
});

test('Function call parsing', t => {
  t.deepEqual(
    compile('myFunc()'),
    [{ [TYPE_FUNC]: ['myFunc', []] }],
    'it should parse function calls'
  );
  t.deepEqual(
    compile('a()'),
    [{ [TYPE_FUNC]: ['a', []] }],
    'it should allow function name with one letter'
  );
  t.throws(
    () => compile('(a())'),
    undefined,
    'it should not allow function call inside parentheses as statement'
  );
  t.deepEqual(
    rhs(t, compile('b = (a())')),
    { [TYPE_FUNC]: ['a', []] },
    'it should allow function call inside parentheses as term'
  );
  t.throws(
    () => rhs(t, compile('if()')),
    undefined,
    'it should not allow reserved word as function name'
  );
  t.deepEqual(
    compile('ifMyFunc()'),
    [{ [TYPE_FUNC]: ['ifMyFunc', []] }],
    'it should allow function name starting with reserved word'
  );
  t.deepEqual(
    compile('MyFunc() $myFunc() _myFunc()'),
    [
      { [TYPE_FUNC]: ['MyFunc', []] },
      { [TYPE_FUNC]: ['$myFunc', []] },
      { [TYPE_FUNC]: ['_myFunc', []] }
    ],
    'it should allow any letter or "$" or "_" as first letter of function name'
  );
  t.throws(
    () => compile('1myFunc()'),
    undefined,
    'it should not allow function name starting with a number'
  );
  t.deepEqual(
    compile('myFunc(1, 5)'),
    [{ [TYPE_FUNC]: ['myFunc', [{ number: [1] }, { number: [5] }]] }],
    'it should parse function calls with arguments'
  );
  t.deepEqual(
    compile('myFunc(8, myVar, myFunc(), "string", (9), myVar.myMethod(), myVar.myProp, [1, 2])'),
    [
      {
        [TYPE_FUNC]: [
          'myFunc',
          [
            { number: [8] },
            { [TYPE_VAR]: ['myVar'] },
            { [TYPE_FUNC]: ['myFunc', []] },
            { string: ['string'] },
            { number: [9] },
            { [TYPE_CALL]: [{ [TYPE_VAR]: ['myVar'] }, 'myMethod', []] },
            { [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] },
            { array: [{ number: [1] }, { number: [2] }] }
          ]
        ]
      }
    ],
    'it should parse function calls with arguments of any type'
  );
  t.throws(() => compile('myFunc(1,2,,3)'), undefined, 'it should not allow elisions');
  t.end();
});

test('Variable parsing', t => {
  t.deepEqual(
    rhs(t, compile('a = myVar')),
    { [TYPE_VAR]: ['myVar'] },
    'it should parse simple variable'
  );
  t.deepEqual(
    rhs(t, compile('a = b')),
    { [TYPE_VAR]: ['b'] },
    'it should allow variable name with one letter'
  );
  t.deepEqual(
    rhs(t, compile('a = (b)')),
    { [TYPE_VAR]: ['b'] },
    'it should allow variable reference inside parentheses'
  );
  t.throws(
    () => rhs(t, compile('a = if')),
    undefined,
    'it should not allow reserved word as variable name'
  );
  t.deepEqual(
    rhs(t, compile('a = ifMyVar')),
    { [TYPE_VAR]: ['ifMyVar'] },
    'it should allow variable name starting with reserved word'
  );
  t.deepEqual(
    rhs(t, compile('a = $MyVar')),
    { [TYPE_VAR]: ['$MyVar'] },
    'it should allow variable name starting with "$"'
  );
  t.deepEqual(
    rhs(t, compile('a = _MyVar')),
    { [TYPE_VAR]: ['_MyVar'] },
    'it should allow variable name starting with "_"'
  );
  t.throws(
    () => compile('a = 1myVar'),
    undefined,
    'it should not allow variable name starting with a number'
  );
  t.end();
});

test('Variable property and methods parsing', t => {
  t.deepEqual(
    rhs(t, compile('a = myVar.myProp')),
    { [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] },
    'it should parse variable property'
  );
  t.deepEqual(
    rhs(t, compile('a = myVar.myProp.myDeepProp')),
    {
      [TYPE_PROP]: [{ [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] }, 'myDeepProp']
    },
    'it should parse nested variable property'
  );
  t.throws(
    () => rhs(t, compile('a = b.(c)')),
    undefined,
    'it should not allow property inside parentheses'
  );
  t.throws(
    () => rhs(t, compile('a = b.if')),
    undefined,
    'it should not allow reserved word as property name'
  );
  t.deepEqual(
    rhs(t, compile('a = b.ifMyProp')),
    { [TYPE_PROP]: [{ [TYPE_VAR]: ['b'] }, 'ifMyProp'] },
    'it should allow property name starting with reserved word'
  );
  t.deepEqual(
    rhs(t, compile('a = b.$MyProp')),
    { [TYPE_PROP]: [{ [TYPE_VAR]: ['b'] }, '$MyProp'] },
    'it should allow property name starting with "$'
  );
  t.deepEqual(
    rhs(t, compile('a = b._MyProp')),
    { [TYPE_PROP]: [{ [TYPE_VAR]: ['b'] }, '_MyProp'] },
    'it should allow property name starting with "_"'
  );
  t.throws(
    () => compile('a = b.1myProp'),
    undefined,
    'it should not allow property name starting with a number'
  );
  t.deepEqual(
    rhs(t, compile('a = myVar.myMethod()')),
    { [TYPE_CALL]: [{ [TYPE_VAR]: ['myVar'] }, 'myMethod', []] },
    'it should parse variable method'
  );
  t.deepEqual(
    rhs(t, compile('a = myVar.myMethod().myDeepMethod()')),
    {
      [TYPE_CALL]: [
        { [TYPE_CALL]: [{ [TYPE_VAR]: ['myVar'] }, 'myMethod', []] },
        'myDeepMethod',
        []
      ]
    },
    'it should parse nested variable method'
  );
  t.throws(
    () => rhs(t, compile('a = b.(c())')),
    undefined,
    'it should not allow method call inside parentheses'
  );
  t.throws(
    () => rhs(t, compile('a = b.if()')),
    undefined,
    'it should not allow reserved word as method name'
  );
  t.deepEqual(
    rhs(t, compile('a = b.ifMyMethod()')),
    { [TYPE_CALL]: [{ [TYPE_VAR]: ['b'] }, 'ifMyMethod', []] },
    'it should allow method name starting with reserved word'
  );
  t.deepEqual(
    rhs(t, compile('a = b.$MyMethod()')),
    { [TYPE_CALL]: [{ [TYPE_VAR]: ['b'] }, '$MyMethod', []] },
    'it should allow method name starting with "$'
  );
  t.deepEqual(
    rhs(t, compile('a = b._MyMethod()')),
    { [TYPE_CALL]: [{ [TYPE_VAR]: ['b'] }, '_MyMethod', []] },
    'it should allow method name starting with "_"'
  );
  t.throws(
    () => compile('a = b.1myMethod()'),
    undefined,
    'it should not allow method name starting with a number'
  );
  t.deepEqual(
    rhs(t, compile('a = b.myMethod(1, 5)')),
    {
      [TYPE_CALL]: [{ [TYPE_VAR]: ['b'] }, 'myMethod', [{ number: [1] }, { number: [5] }]]
    },
    'it should parse method call with arguments'
  );
  t.deepEqual(
    rhs(
      t,
      compile(
        'a = b.myMethod(8, myVar, myFunc(), "string", (9), myVar.myMethod(), myVar.myProp, [1, 2])'
      )
    ),
    {
      [TYPE_CALL]: [
        { [TYPE_VAR]: ['b'] },
        'myMethod',
        [
          { number: [8] },
          { [TYPE_VAR]: ['myVar'] },
          { [TYPE_FUNC]: ['myFunc', []] },
          { string: ['string'] },
          { number: [9] },
          { [TYPE_CALL]: [{ [TYPE_VAR]: ['myVar'] }, 'myMethod', []] },
          { [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] },
          { array: [{ number: [1] }, { number: [2] }] }
        ]
      ]
    },
    'it should parse method call with arguments of any type'
  );
  t.throws(() => compile('a = b.myMethod(1,2,,3)'), undefined, 'it should not allow elisions');
  t.deepEqual(
    rhs(t, compile('a = myVar.myProp.myMethod()')),
    {
      [TYPE_CALL]: [{ [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] }, 'myMethod', []]
    },
    'it should parse nested variable method after property'
  );
  t.deepEqual(
    rhs(t, compile('a = myVar.myMethod().myProp')),
    {
      [TYPE_PROP]: [{ [TYPE_CALL]: [{ [TYPE_VAR]: ['myVar'] }, 'myMethod', []] }, 'myProp']
    },
    'it should parse nested variable property after method'
  );
  t.end();
});
