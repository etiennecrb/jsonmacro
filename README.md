# JsonMacro
A simple language that compiles to a JSON object whose syntax is a derivated of the one used by [JSON logic](http://jsonlogic.com/).

This project aims at creating a set of tools to make your users code and to execute their custom scripts safely. 

## TODO
### Compiler
 - [x] Number
 - [x] String
 - [x] Array
 - [x] Variable and function
 - [x] If X then Y else Z
 - [ ] NOT operator
 - [ ] Handle signed expression like `a = -(1+2)`
 - [ ] For each X in Y do Z
 - [ ] While X do Y
 - [ ] All X in Y verify Z
 - [ ] Some X in Y verify Z
 - [ ] Array element getter
 - [ ] Computed array elements
 - [ ] Escape characters in strings

### Code editor
Using [http://codemirror.net/](CodeMirror)
 - [ ] Syntax highlighting
 - [ ] Auto-completion

### Interpreter
 - [ ] A JavaScript interpreter that executes compiled JsonScript
 