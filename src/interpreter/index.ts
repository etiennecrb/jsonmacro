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

function evalStatement(statement, params) {
  const operator = getOperator(statement);
  const args = statement[operator];
  statementHandler[operator](statement, args, params);
}

function evalExpression(expression, params): any {
  const operator = getOperator(expression);
  if (!operator) {
    return expression;
  }

  const args = expression[operator];
  return expressionHandler[operator](args.map(exp => evalExpression(exp, params)), params);
}

function getOperator(jsonm) {
  const keys = _.keys(jsonm);
  if (!_.isPlainObject(jsonm) || keys.length === 0 || keys.length > 1) {
    return null;
  }
  return keys[0];
}
