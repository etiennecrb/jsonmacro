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
          result[element.type].push(element.args);
        }
        return result;
      }, head);
  }
  
  function buildExpression(head, tail) {
    if (tail === null) {
      return head;
    } else {
      return tail.reduce(function (result, el) {
        return {[el[1]]: [result, el[3]]};
      }, head);
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
  / ForEachInDo

VariableAssignment
  = variable:Identifier __ '=' !'=' __ assignment:Expression {
    return {'=': [buildVariable(variable), assignment]};
  }

FunctionCall
  = VariableMethod
  / GlobalFunctionCall

GlobalFunctionCall
  = identifier:Identifier '(' __ args: ElementList __ ')' {
    return {[TYPE_FUNC]: [identifier, args]};
  }

IfThenElse
  = If __ predicate:Expression __ Then __
    thenStatements:Statements __
    elseStatements:(
      Else __ elseIfStatements:IfThenElse { return [elseIfStatements]; }
      / Else __ elseStatements:Statements __ End __ { return elseStatements; }
      / End __ { return null; }
    ) {
    return {'if': [predicate, thenStatements, elseStatements || []]};
  }

ForEachInDo
  = For __ Each __ localVar:Identifier __ In __ list:Term __ Do __
    statements:Statements __
    End __ {
    return {'foreach': [localVar, list, statements || []]};
  }

Expression
  = OrExpression

OrExpression
  = head:AndExpression tail:( __ 'or' __ AndExpression)* {
      return buildExpression(head, tail);
  }

AndExpression
  = head:Equality tail:( __ 'and' __ Equality)* {
      return buildExpression(head, tail);
  }

Equality
  = head:Relation tail:(__ ('==' / '!=') __ Relation)* {
      return buildExpression(head, tail);
    }

Relation
  = head:Sum tail:(__ ('<=' / '>=' / '<' / '>') __ Sum)* {
      return buildExpression(head, tail);
    }

Sum
  = head:Product tail:( __ ('+' / '-') __ Product)* {
      return buildExpression(head, tail);
  }

Product
  = head:NotExpression tail:( __ ('*' / '/') __ NotExpression)* {
      return buildExpression(head, tail);
  }

NotExpression
  = not:('not' __ Term) {
      return {'not': [not[2]]};
  }
  / Term

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

SignedNumber "number"
  = [+-]? Number { return parseFloat(text()); }

Number
  = [0-9] "." [0-9]* 
  / "." [0-9]+
  / [0-9]+

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
  = identifier:Identifier '(' __ args: ElementList __ ')' {
      return {identifier: identifier, type: TYPE_CALL, args: args};
    }

Variable "variable"
  = Identifier {
    return buildVariable(text());
  }

Identifier "identifier"
  = !ReservedWord name:IdentifierName { return name; }

IdentifierName
  = head:IdentifierStart tail:IdentifierPart* {
      return head + tail.join('');
    }

IdentifierStart
  = [a-zA-Z]
  / '$'
  / '_'

IdentifierPart
  = [a-zA-Z]
  / [0-9]
  / '$'
  / '_'

Array "array"
  = "[" __ elements:ElementList __ "]" {
      return elements;
    }

ElementList
  = head:(element:Expression) tail:(__ "," __ element:Expression { return element; })* {
      return Array.prototype.concat.call([head], tail);
    }
  / __ {
    return [];
  }

String "string"
  = '"' chars:StringCharacter* '"' {
      return chars.join('');
    }

StringCharacter
  = !('"') . { return text(); }

ReservedWord
  = If
  / Then
  / Else
  / For
  / Each
  / Do
  / End
  / Not
  / In
  / And
  / Or

If = 'if' !IdentifierPart
Then = 'then' !IdentifierPart
Else = 'else' !IdentifierPart
For = 'for' !IdentifierPart
Each = 'each' !IdentifierPart
In = 'in' !IdentifierPart
Do = 'do' !IdentifierPart
End = 'end' !IdentifierPart
Not = 'not' !IdentifierPart
And = 'and' !IdentifierPart
Or = 'or' !IdentifierPart

__
  = WhiteSpace*

WhiteSpace "whitespace"
  = "\\n"
  / "\\r"
  / "\\t"
  / " "
`;
