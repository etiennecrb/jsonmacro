const test = require('tape');

const { compile } = require('../../dist/jsonmacro.compiler');
const { rhs, TYPE_VAR, TYPE_FUNC, TYPE_PROP, TYPE_CALL } = require('../utils');

test('Sum parsing', t => {
  t.deepEqual(
    rhs(t, compile('a = 8 + 2')),
    { '+': [{ number: [8] }, { number: [2] }] },
    'it should parse simple addition'
  );
  t.deepEqual(
    rhs(t, compile('a = 8 - 2')),
    { '-': [{ number: [8] }, { number: [2] }] },
    'it should parse simple subtraction'
  );
  t.deepEqual(
    rhs(t, compile('a = 8+2')),
    { '+': [{ number: [8] }, { number: [2] }] },
    'it should parse sum without whitespaces'
  );
  t.deepEqual(
    rhs(t, compile('a = (8-(2)) ')),
    { '-': [{ number: [8] }, { number: [2] }] },
    'it should parse sum inside parentheses'
  );
  t.deepEqual(
    rhs(t, compile('a = 8+2-1')),
    { '-': [{ '+': [{ number: [8] }, { number: [2] }] }, { number: [1] }] },
    'it should parse multiple sum expressions'
  );
  t.deepEqual(
    rhs(
      t,
      compile(
        'a = "string" + myVar - [] + myFunc() - myVar.myProp + (myVar.myMethod())'
      )
    ),
    {
      '+': [
        {
          '-': [
            {
              '+': [
                {
                  '-': [
                    {
                      '+': [{ string: ['string'] }, { [TYPE_VAR]: ['myVar'] }]
                    },
                    { array: [] }
                  ]
                },
                { [TYPE_FUNC]: ['myFunc', []] }
              ]
            },
            { [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] }
          ]
        },
        { [TYPE_CALL]: [{ [TYPE_VAR]: ['myVar'] }, 'myMethod', []] }
      ]
    },
    'it should parse sum with any term type'
  );
  t.end();
});

test('Product parsing', t => {
  t.deepEqual(
    rhs(t, compile('a = 8 * 2')),
    { '*': [{ number: [8] }, { number: [2] }] },
    'it should parse simple multiplication'
  );
  t.deepEqual(
    rhs(t, compile('a = 8 / 2')),
    { '/': [{ number: [8] }, { number: [2] }] },
    'it should parse simple division'
  );
  t.deepEqual(
    rhs(t, compile('a = 8*2')),
    { '*': [{ number: [8] }, { number: [2] }] },
    'it should parse product without whitespaces'
  );
  t.deepEqual(
    rhs(t, compile('a = (8/(2)) ')),
    { '/': [{ number: [8] }, { number: [2] }] },
    'it should parse product inside parentheses'
  );
  t.deepEqual(
    rhs(t, compile('a = 8*2/1')),
    { '/': [{ '*': [{ number: [8] }, { number: [2] }] }, { number: [1] }] },
    'it should parse multiple product expressions'
  );
  t.deepEqual(
    rhs(
      t,
      compile(
        'a = "string" * myVar / [] * myFunc() / myVar.myProp * (myVar.myMethod())'
      )
    ),
    {
      '*': [
        {
          '/': [
            {
              '*': [
                {
                  '/': [
                    {
                      '*': [{ string: ['string'] }, { [TYPE_VAR]: ['myVar'] }]
                    },
                    { array: [] }
                  ]
                },
                { [TYPE_FUNC]: ['myFunc', []] }
              ]
            },
            { [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] }
          ]
        },
        { [TYPE_CALL]: [{ [TYPE_VAR]: ['myVar'] }, 'myMethod', []] }
      ]
    },
    'it should parse product with any term type'
  );
  t.end();
});

test('Sum-product precedence', t => {
  t.deepEqual(
    rhs(t, compile('a = 8 * 2 + 1')),
    { '+': [{ '*': [{ number: [8] }, { number: [2] }] }, { number: [1] }] },
    'it should enforce sum-product precedence on the left'
  );
  t.deepEqual(
    rhs(t, compile('a = 8 + 2 * 1')),
    { '+': [{ number: [8] }, { '*': [{ number: [2] }, { number: [1] }] }] },
    'it should enforce sum-product precedence on the right'
  );
  t.deepEqual(
    rhs(t, compile('a = 8 * (2 + 1)')),
    { '*': [{ number: [8] }, { '+': [{ number: [2] }, { number: [1] }] }] },
    'it should enforce parentheses precedence'
  );
  t.deepEqual(
    rhs(t, compile('a = (8 + 1) * (2 / (3 - 1) + 1 * 9)')),
    {
      '*': [
        { '+': [{ number: [8] }, { number: [1] }] },
        {
          '+': [
            {
              '/': [
                { number: [2] },
                { '-': [{ number: [3] }, { number: [1] }] }
              ]
            },
            { '*': [{ number: [1] }, { number: [9] }] }
          ]
        }
      ]
    },
    'it should enforce sum-product precedence on complex expressions'
  );
  t.end();
});

test('OR parsing', t => {
  t.deepEqual(
    rhs(t, compile('a = 8 or 2')),
    { or: [{ number: [8] }, { number: [2] }] },
    'it should parse simple OR expression'
  );
  t.deepEqual(
    rhs(t, compile('a = (8 or (2)) ')),
    { or: [{ number: [8] }, { number: [2] }] },
    'it should parse OR expression inside parentheses'
  );
  t.deepEqual(
    rhs(t, compile('a = 8 or 2 or 1')),
    { or: [{ or: [{ number: [8] }, { number: [2] }] }, { number: [1] }] },
    'it should parse multiple OR expressions'
  );
  t.deepEqual(
    rhs(
      t,
      compile(
        'a = "string" or myVar or [] or myFunc() or myVar.myProp or (myVar.myMethod())'
      )
    ),
    {
      or: [
        {
          or: [
            {
              or: [
                {
                  or: [
                    {
                      or: [{ string: ['string'] }, { [TYPE_VAR]: ['myVar'] }]
                    },
                    { array: [] }
                  ]
                },
                { [TYPE_FUNC]: ['myFunc', []] }
              ]
            },
            { [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] }
          ]
        },
        { [TYPE_CALL]: [{ [TYPE_VAR]: ['myVar'] }, 'myMethod', []] }
      ]
    },
    'it should parse OR expression with any term type'
  );
  t.end();
});

test('AND parsing', t => {
  t.deepEqual(
    rhs(t, compile('a = 8 and 2')),
    { and: [{ number: [8] }, { number: [2] }] },
    'it should parse simple and expression'
  );
  t.deepEqual(
    rhs(t, compile('a = (8 and (2)) ')),
    { and: [{ number: [8] }, { number: [2] }] },
    'it should parse and expression inside parentheses'
  );
  t.deepEqual(
    rhs(t, compile('a = 8 and 2 and 1')),
    { and: [{ and: [{ number: [8] }, { number: [2] }] }, { number: [1] }] },
    'it should parse multiple and expressions'
  );
  t.deepEqual(
    rhs(
      t,
      compile(
        'a = "string" and myVar and [] and myFunc() and myVar.myProp and (myVar.myMethod())'
      )
    ),
    {
      and: [
        {
          and: [
            {
              and: [
                {
                  and: [
                    {
                      and: [{ string: ['string'] }, { [TYPE_VAR]: ['myVar'] }]
                    },
                    { array: [] }
                  ]
                },
                { [TYPE_FUNC]: ['myFunc', []] }
              ]
            },
            { [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] }
          ]
        },
        { [TYPE_CALL]: [{ [TYPE_VAR]: ['myVar'] }, 'myMethod', []] }
      ]
    },
    'it should parse and expression with any term type'
  );
  t.end();
});

test('AND-OR precedence', t => {
  t.deepEqual(
    rhs(t, compile('a = 8 and 2 or 1')),
    { or: [{ and: [{ number: [8] }, { number: [2] }] }, { number: [1] }] },
    'it should enforce AND-OR precedence on the left'
  );
  t.deepEqual(
    rhs(t, compile('a = 8 or 2 and 1')),
    { or: [{ number: [8] }, { and: [{ number: [2] }, { number: [1] }] }] },
    'it should enforce AND-OR precedence on the right'
  );
  t.deepEqual(
    rhs(t, compile('a = 8 and (2 or 1)')),
    { and: [{ number: [8] }, { or: [{ number: [2] }, { number: [1] }] }] },
    'it should enforce parentheses precedence'
  );
  t.deepEqual(
    rhs(t, compile('a = (8 or 1) and (2 and (3 or 1) or 1 and 9)')),
    {
      and: [
        { or: [{ number: [8] }, { number: [1] }] },
        {
          or: [
            {
              and: [{ number: [2] }, { or: [{ number: [3] }, { number: [1] }] }]
            },
            { and: [{ number: [1] }, { number: [9] }] }
          ]
        }
      ]
    },
    'it should enforce AND-OR precedence on complex expressions'
  );
  t.end();
});

test('NOT parsing', t => {
  t.deepEqual(
    rhs(t, compile('a = not 2')),
    { not: [{ number: [2] }] },
    'it should parse simple NOT expression'
  );
  t.deepEqual(
    rhs(t, compile('a = not myBoolean')),
    { not: [{ [TYPE_VAR]: ['myBoolean'] }] },
    'it should parse simple NOT expression with variable'
  );
  t.deepEqual(
    rhs(t, compile('a = 1 and not 0 or 2')),
    {
      or: [
        { and: [{ number: [1] }, { not: [{ number: [0] }] }] },
        { number: [2] }
      ]
    },
    'it should parse simple NOT expression within boolean expression'
  );
  t.deepEqual(
    rhs(t, compile('a = 1 and not (0 or 2)')),
    {
      and: [
        { number: [1] },
        { not: [{ or: [{ number: [0] }, { number: [2] }] }] }
      ]
    },
    'it should parse NOT expression within boolean expression with parentheses precedence'
  );
  t.end();
});

test('Relation parsing', t => {
  t.deepEqual(rhs(t, compile('a = 8 <= 2')), {
    '<=': [{ number: [8] }, { number: [2] }]
  });
  t.deepEqual(rhs(t, compile('a = 8 >= 2')), {
    '>=': [{ number: [8] }, { number: [2] }]
  });
  t.deepEqual(rhs(t, compile('a = 8 > 2')), {
    '>': [{ number: [8] }, { number: [2] }]
  });
  t.deepEqual(rhs(t, compile('a = 8 < 2')), {
    '<': [{ number: [8] }, { number: [2] }]
  });
  t.deepEqual(rhs(t, compile('a = 8 != 2')), {
    '!=': [{ number: [8] }, { number: [2] }]
  });
  t.deepEqual(rhs(t, compile('a = 8 == 2')), {
    '==': [{ number: [8] }, { number: [2] }]
  });
  t.end();
});

test('Expression type precedence', t => {
  t.deepEqual(
    rhs(t, compile('a = 1 and 9 > 2')),
    { and: [{ number: [1] }, { '>': [{ number: [9] }, { number: [2] }] }] },
    'it should enforce boolean expression precedence over relation expression'
  );
  t.deepEqual(
    rhs(t, compile('a = 1 or 9 != 2')),
    { or: [{ number: [1] }, { '!=': [{ number: [9] }, { number: [2] }] }] },
    'it should enforce boolean expression precedence over equality expression'
  );
  t.deepEqual(
    rhs(t, compile('a = 1 and 9 + 2')),
    { and: [{ number: [1] }, { '+': [{ number: [9] }, { number: [2] }] }] },
    'it should enforce boolean expression precedence over sum expression'
  );
  t.deepEqual(
    rhs(t, compile('a = 1 or 9 / 2')),
    { or: [{ number: [1] }, { '/': [{ number: [9] }, { number: [2] }] }] },
    'it should enforce boolean expression precedence over product expression'
  );
  t.deepEqual(
    rhs(t, compile('a = 1 >= 9 + 2')),
    { '>=': [{ number: [1] }, { '+': [{ number: [9] }, { number: [2] }] }] },
    'it should enforce sum expression precedence over relation expression'
  );
  t.deepEqual(
    rhs(t, compile('a = 1 < 9 * 2')),
    { '<': [{ number: [1] }, { '*': [{ number: [9] }, { number: [2] }] }] },
    'it should enforce product expression precedence over relation expression'
  );
  t.deepEqual(
    rhs(t, compile('a = 1 != 9 + 2')),
    { '!=': [{ number: [1] }, { '+': [{ number: [9] }, { number: [2] }] }] },
    'it should enforce sum expression precedence over equality expression'
  );
  t.deepEqual(
    rhs(t, compile('a = 1 == 9 * 2')),
    { '==': [{ number: [1] }, { '*': [{ number: [9] }, { number: [2] }] }] },
    'it should enforce product expression precedence over equality expression'
  );
  t.deepEqual(
    rhs(t, compile('a = 1 == 9 + 3 and 2 > 1 or 4 + 3 / 2 <= 0')),
    {
      or: [
        {
          and: [
            {
              '==': [
                { number: [1] },
                { '+': [{ number: [9] }, { number: [3] }] }
              ]
            },
            { '>': [{ number: [2] }, { number: [1] }] }
          ]
        },
        {
          '<=': [
            {
              '+': [
                { number: [4] },
                { '/': [{ number: [3] }, { number: [2] }] }
              ]
            },
            { number: [0] }
          ]
        }
      ]
    },
    'it should enforce expression precedence on complex expression'
  );
  t.deepEqual(
    rhs(t, compile('a = (1 == 9) + 3 and (2 > (1 or 4 + 3) / 2 <= 0)')),
    {
      and: [
        {
          '+': [{ '==': [{ number: [1] }, { number: [9] }] }, { number: [3] }]
        },
        {
          '<=': [
            {
              '>': [
                { number: [2] },
                {
                  '/': [
                    {
                      or: [
                        { number: [1] },
                        { '+': [{ number: [4] }, { number: [3] }] }
                      ]
                    },
                    { number: [2] }
                  ]
                }
              ]
            },
            { number: [0] }
          ]
        }
      ]
    },
    'it should enforce expression precedence on complex expression with parentheses'
  );
  t.deepEqual(
    rhs(
      t,
      compile(
        'a = myVar == [] + "string" and myFunc(3, 4) > 1 or not myVar.myProp / (2) <= 0'
      )
    ),
    {
      or: [
        {
          and: [
            {
              '==': [
                { [TYPE_VAR]: ['myVar'] },
                { '+': [{ array: [] }, { string: ['string'] }] }
              ]
            },
            {
              '>': [
                { [TYPE_FUNC]: ['myFunc', [{ number: [3] }, { number: [4] }]] },
                { number: [1] }
              ]
            }
          ]
        },
        {
          '<=': [
            {
              '/': [
                {
                  not: [{ [TYPE_PROP]: [{ [TYPE_VAR]: ['myVar'] }, 'myProp'] }]
                },
                { number: [2] }
              ]
            },
            { number: [0] }
          ]
        }
      ]
    },
    'it should enforce expression precedence on complex expression with any type of term'
  );
  t.end();
});
