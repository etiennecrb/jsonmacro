import _ from 'lodash';

export interface IHandlerParams {
  context: any,
  registry: any,
  func: any
}

export type StatementHandler = (statement: any, args: any[], params: IHandlerParams) => void
export type ExpressionHandler = (args: any[], params: IHandlerParams) => any

const statementHandler: {[operator: string]: StatementHandler} = {
  '=': assignmentHandler,
  func: (statement, args, params) => functionHandler(args, params),
  if: ifHandler,
  foreach: foreachHandler
};

const expressionHandler: {[operator: string]: ExpressionHandler} = {
  func: functionHandler,
  var: varHandler,
  and: andHandler,
  or: orHandler,
  not: notHandler,
  '==': equalityHandler,
  '!=': differenceHandler,
  '>=': getHandler,
  '>': gtHandler,
  '<=': letHandler,
  '<': ltHandler,
  '+': addHandler,
  '-': subtractHandler,
  '*': multiplyHandler,
  '/': divideHandler,
  number: identity('number'),
  array: identity('array'),
  boolean: identity('boolean'),
  string: identity('string')
};

export function run(jsonm, options) {
  const params = {
    context: {},
    registry: {},
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
  const { operator, args } = getTokenArguments(token);
  return expressionHandler[operator](args, params);
}

function getTokenArguments(token) {
  const operator = _.keys(token)[0];
  const args = token[operator];
  return { operator, args };
}

function identity(op) {
  return (args, params) => ({[op]: args});
}

function assignmentHandler(statement: any, args: any[], params: IHandlerParams) {
  const identifier = args[0]['var'][0];
  const value = args[1];
  params.registry[identifier] = evalExpression(value, params);
}

function ifHandler(statement: any, args: any[], params: IHandlerParams) {
  const [predicate, thenStatements, elseStatements] = args;
  if (unpackPrimitive(evalExpression(predicate, params))) {
    evalStatements(thenStatements, params);
  } else {
    evalStatements(elseStatements, params);
  }
}

function foreachHandler(statement: any, args: any[], params: IHandlerParams) {
  const identifier = args[0];
  const values = unpackPrimitive(evalExpression(args[1], params));
  const statements = args[2];
  for (let i = 0; i < values.length; i++) {
    params.registry[identifier] = values[i];
    evalStatements(statements, params);
  }
}

function varHandler(args: any[], params: IHandlerParams) {
  return params.registry[args[0]];
}

function functionHandler(args: any[], params: IHandlerParams) {
  const identifier = args[0];
  const argValues = args[1].map(exp => unpackPrimitive(evalExpression(exp, params)));
  return params.func[identifier](...argValues, params.context);
}

function andHandler(args: any[], params: IHandlerParams) {
  return {'boolean': [args.reduce((result, arg) => result && unpackPrimitive(evalExpression(arg, params)), true)]};
}

function orHandler(args: any[], params: IHandlerParams) {
  return {'boolean': [args.reduce((result, arg) => result || unpackPrimitive(evalExpression(arg, params)), false)]};
}

function notHandler(args: any[], params: IHandlerParams) {
  return {'boolean': [!unpackPrimitive(evalExpression(args[0], params))]};
}

function equalityHandler(args: any[], params: IHandlerParams) {
  return {'boolean': [unpackPrimitive(evalExpression(args[0], params)) === unpackPrimitive(evalExpression(args[1], params))]};
}

function differenceHandler(args: any[], params: IHandlerParams) {
  return {'boolean': [unpackPrimitive(evalExpression(args[0], params)) !== unpackPrimitive(evalExpression(args[1], params))]};
}

function gtHandler(args: any[], params: IHandlerParams) {
  return {'boolean': [unpackPrimitive(evalExpression(args[0], params)) > unpackPrimitive(evalExpression(args[1], params))]};
}

function getHandler(args: any[], params: IHandlerParams) {
  return {'boolean': [unpackPrimitive(evalExpression(args[0], params)) >= unpackPrimitive(evalExpression(args[1], params))]};
}

function ltHandler(args: any[], params: IHandlerParams) {
  return {'boolean': [unpackPrimitive(evalExpression(args[0], params)) < unpackPrimitive(evalExpression(args[1], params))]};
}

function letHandler(args: any[], params: IHandlerParams) {
  return {'boolean': [unpackPrimitive(evalExpression(args[0], params)) <= unpackPrimitive(evalExpression(args[1], params))]};
}

function addHandler(args: any[], params: IHandlerParams) {
  return {'number': [unpackPrimitive(evalExpression(args[0], params)) + unpackPrimitive(evalExpression(args[1], params))]};
}

function subtractHandler(args: any[], params: IHandlerParams) {
  return {'number': [unpackPrimitive(evalExpression(args[0], params)) - unpackPrimitive(evalExpression(args[1], params))]};
}

function multiplyHandler(args: any[], params: IHandlerParams) {
  return {'number': [unpackPrimitive(evalExpression(args[0], params)) * unpackPrimitive(evalExpression(args[1], params))]};
}

function divideHandler(args: any[], params: IHandlerParams) {
  return {'number': [unpackPrimitive(evalExpression(args[0], params)) / unpackPrimitive(evalExpression(args[1], params))]};
}

function unpackPrimitive(token) {
  const { operator, args } = getTokenArguments(token);
  if (operator === 'number' || operator === 'string' || operator === 'boolean') {
    return args[0];
  } else if (operator === 'array') {
    return args;
  }
}
