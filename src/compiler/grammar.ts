export const grammar = `
{
  var TYPE_VAR = 'var';
  var TYPE_FUNC = 'func';
  var TYPE_PROP = 'prop';
  var TYPE_CALL = 'call';

  function extractOptional(optional, index) {
    return optional ? optional[index] : null;
  }
  
  function optionalList(value) {
    return value !== null ? value : [];
  }

  function extractList(list, index) {
    return list.map(function (element) { return element[index]; });
  }

  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }
  
  function buildVariable(identifier) {
    return {[TYPE_VAR]: [identifier]};
  }
  
  function buildVariablePropOrMethod(head, tail) {
    return tail.reduce(function (acc, element) {
        var result = {};
        result[element.type] = [acc, element.identifier];
        if (element.type === TYPE_CALL) {
          result[element.type].push(element.argumentList);
        }
        return result;
      }, head);
  }
  
  function buildExpression(left, right) {
    if (right === null) {
      return left;
    } else {
      return right.reduce(function (result, el) {
        return {[el[1]]: [result, el[3]]};
      }, left);
    }
  }
}

Start
  = __ statements:Statements? __ {
    return optionalList(statements);
  }

Statements "list of statements"
  = head:Statement tail:(__ Statement)* {
    return buildList(head, tail, 1);
  }

Statement "statement"
  = VariableAssignment
  / FunctionCall
  / IfThenElse

VariableAssignment
  = variable:Identifier __ '=' !'=' __ assignment:Expression {
    return {'=': [buildVariable(variable), assignment]};
  }

FunctionCall
  = VariableMethod
  / GlobalFunctionCall

GlobalFunctionCall
  = identifier:Identifier '(' __ argumentList: Arguments __ ')' {
    return {[TYPE_FUNC]: [identifier, argumentList]};
  }

IfThenElse
  = 'if' __ predicate:Expression __ 'then' __
    thenStatements:Statements __
    elseStatements:(
      'else' __ elseIfStatements:IfThenElse { return [elseIfStatements]; }
      / 'else' __ elseStatements:Statements __ 'end' __ { return elseStatements; }
      / 'end' __ { return null; }
    ) {
    return {'if': [predicate, thenStatements, elseStatements || []]};
  }

Expression
  = Or

Or
  = left:And right:( __ 'or' __ And)* {
      return buildExpression(left, right);
  }

And
  = left:Equality right:( __ 'and' __ Equality)* {
      return buildExpression(left, right);
  }

Equality
  = left:Relation right:(__ ('==' / '!=') __ Relation)* {
      return buildExpression(left, right);
    }

Relation
  = left:Sum right:(__ ('<=' / '>=' / '<' / '>') __ Sum)* {
      return buildExpression(left, right);
    }

Sum
  = left:Product right:( __ ('+' / '-') __ Product)* {
      return buildExpression(left, right);
  }

Product
  = left:Term right:( __ ('*' / '/') __ Term)* {
      return buildExpression(left, right);
  }

Term
  = SignedNumber
  / FunctionCall
  / VariablePropOrMethod
  / Variable
  / Array
  / String
  / '(' __ exp:Expression __ ')' {
    return exp;
  }

SignedNumber
  = [+-]? Number { return parseFloat(text()); }

Number "number"
  = [0-9] "." [0-9]* {
      return parseFloat(text());
    }
  / "." [0-9]+ {
      return parseFloat(text());
    }
  / [0-9]+ {
      return parseFloat(text());
    }

VariablePropOrMethod
  = head:Variable
    tail:('.' PropOrMethod)+ {
      return buildVariablePropOrMethod(head, extractList(tail, 1));
    }

VariableMethod
  = head:Variable '.'
    body:(PropOrMethod '.')*
    tail:(Method) {
      return buildVariablePropOrMethod(head, (extractList(body, 0) || []).concat([tail]));
    }
    
PropOrMethod
  = Method
  / Prop

Prop
  = identifier:Identifier {
      return {identifier: identifier, type: TYPE_PROP};
    }

Method
  = identifier:Identifier '(' __ argumentList: Arguments __ ')' {
      return {identifier: identifier, type: TYPE_CALL, argumentList: argumentList};
    }

Arguments "list of arguments"
  = left:Expression right:(__ "," __ Expression)* {
      if (right === null) {
        return [left];
      } else {
        return [left].concat(right.map(function (el) { return el[3]; }));
      }
    }
  / __ {
    return [];
  }

Variable "variable"
  = Identifier {
    return buildVariable(text());
  }

Identifier "identifier"
  = !ReservedWord name:IdentifierName { return name; }

IdentifierName
  = head:IdentifierPart tail:IdentifierPart* {
      return head + tail.join('');
    }

IdentifierPart
  = [a-zA-Z]
  / [0-9]
  / '_'
  / '$'

Array "array"
  = "[" __ elements:ElementList __ "]" {
      return elements;
    }

ElementList
  = head:(element:Expression) tail:(__ "," __ element:Expression { return element; })* {
    return Array.prototype.concat.apply([head], tail);
  }

String "string"
  = '"' chars:StringCharacter* '"' {
      return chars.join('');
    }

StringCharacter
  = !('"') . { return text(); }

ReservedWord
  = 'if'
  / 'then'
  / 'else'
  / 'for each'
  / 'end'
  / 'while'
  / 'in'
  / 'and'
  / 'or'

__
  = WhiteSpace*

WhiteSpace "whitespace"
  = "\\n"
  / "\\r"
  / "\\t"
  / " "
`;
