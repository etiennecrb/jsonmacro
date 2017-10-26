import _ from 'lodash';

const statementHandler = {
  '=': (statement, args, params) => {
    const identifier = args[0]['var'][0];
    const value = args[1];
    params.local[identifier] = evalExpression(value, params);
  },
  func: (statement, args, params) => {
    evalExpression(statement, params);
  },
  call: (statement, args, params) => {
    evalExpression(statement, params);
  },
  if: (statement, args, params) => {
    const [predicate, thenStatements, elseStatements] = args;
    if (evalExpression(predicate, params)) {
      evalStatements(thenStatements, params);
    } else {
      evalStatements(elseStatements, params);
    }
  },
  foreach: (statement, args, params) => {
    const identifier = args[0];
    const values = evalExpression(args[1], params);
    const statements = args[2];
    if (Array.isArray(values)) {
      values.forEach(value => {
        params.local[identifier] = value;
        evalStatements(statements, params);
      });
    }
  }
};

const expressionHandler = {
  func: (args, params) =>
    params.func[args[0]](...args[1].map(exp => evalExpression(exp, params)), params.context),
  var: (args, params) => params.local[args[0]],
  and: (args, params) => args.reduce((result, arg) => result && arg, true),
  or: (args, params) => args.reduce((result, arg) => result || arg, false),
  not: (args, params) => !args[0],
  '==': (args, params) => args[0] == args[1],
  '!=': (args, params) => args[0] != args[1],
  '>=': (args, params) => args[0] >= args[1],
  '>': (args, params) => args[0] > args[1],
  '<=': (args, params) => args[0] <= args[1],
  '<': (args, params) => args[0] < args[1],
  '+': (args, params) => args[0] + args[1],
  '-': (args, params) => args[0] - args[1],
  '*': (args, params) => args[0] * args[1],
  '/': (args, params) => args[0] / args[1]
};

const primitiveHandler = {
  number: args => args[0],
  string: args => args[0],
  array: args => args
};

export function run(jsonm, options) {
  const params = {
    context: {},
    local: {},
    func: options.func
  };

  evalStatements(jsonm, params);
  return params.context;
}

function evalStatements(statements, params) {
  statements.forEach(statement => evalStatement(statement, params));
}

function evalStatement(token, params) {
  const { operator, args } = getTokenArguments(token);
  statementHandler[operator](token, args, params);
}

function evalExpression(token, params): any {
  if (!_.isPlainObject(token)) {
    return token;
  }

  const { operator, args } = getTokenArguments(token);

  if (isPrimitiveOperator(operator)) {
    return primitiveHandler[operator](args);
  } else {
    return expressionHandler[operator](args.map(exp => evalExpression(exp, params)), params);
  }
}

function isPrimitiveOperator(operator) {
  return _.includes(['array', 'number', 'string'], operator);
}

function getTokenArguments(token) {
  const operator = _.keys(token)[0];
  const args = token[operator];
  return { operator, args };
}
