const test = require('tape');

const { compile } = require('../../dist/jsonmacro.compiler');

test('Empty strings parsing', t => {
    t.deepEqual(compile(''), [], 'it should return an empty array if parsing the empty string');
    t.deepEqual(compile('  \n \r'), [], 'it should return an empty array if parsing a string with only whitespaces');
    t.end();
});