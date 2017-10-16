import 'codemirror/addon/mode/simple';
import 'codemirror/mode/javascript/javascript';
import codeMirror from 'codemirror';
import { compile } from '../index';

// codeMirror.defineSimpleMode('jsonmacro', {
//     // The start state contains the rules that are intially used
//     start: [
//         {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},
//         {regex: /(?:end|if|then|else|and|or|not|is|in|for each|while|do)\b/, token: "keyword"},
//         {regex: /true|false|none/, token: "atom"},
//         {regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i, token: "number"},
//         {regex: /\/\/.*/, token: "comment"},
//         {regex: /[-+\/*=<>]+/, token: "operator"},
//         // indent and dedent properties guide autoindentation
//         {regex: /then|else|do|\[|\(/, indent: true},
//         {regex: /end|]|\)/, dedent: true},
//         {regex: /[a-z$][\w$]*/, token: "variable"}
//     ],
//     meta: {
//         dontIndentStates: [],
//         lineComment: "//"
//     }
// });

export function editor(element: HTMLElement) {
    const container = document.createElement('div');
    container.classList.add('jsonm-container');

    const leftCol = document.createElement('div');
    leftCol.classList.add('jsonm-left-col', 'jsonm-col');
    const rightCol = document.createElement('div');
    rightCol.classList.add('jsonm-right-col', 'jsonm-col');

    const editorEl = document.createElement('div');
    editorEl.classList.add('jsonm-editor', 'jsonm-cell');
    const outputEl = document.createElement('div');
    outputEl.classList.add('jsonm-output', 'jsonm-cell');
    const consoleEl = document.createElement('div');
    consoleEl.classList.add('jsonm-console', 'jsonm-cell');

    leftCol.appendChild(editorEl);
    rightCol.appendChild(outputEl);
    rightCol.appendChild(consoleEl);

    container.appendChild(leftCol);
    container.appendChild(rightCol);

    const editorCm = codeMirror(editorEl, { value: '', mode: 'jsonmacro' });
    const outputCm = codeMirror(outputEl, { value: '', mode: 'application/json', readOnly: true });
    const consoleCm = codeMirror(consoleEl, { value: '', readOnly: true });

    element.appendChild(container);

    editorCm.on('changes', () => {
        render(editorCm.getValue(), outputCm, consoleCm);
    });
}

function render(value, output, console) {
    let result = null;

    try {
        result = compile(value);
    } catch (e) {
        console.setValue(e.toString());
    }

    if (result) {
        const formattedResult = JSON.stringify(result)
            .replace(/:/g, ': ')
            .replace(/,/g, ',\n')
            .replace(/\[/g, '[\n')
            .replace(/]/g, '\n]')
            .replace(/\[\n\n]/g, '[]');
        output.setValue(formattedResult);
        for (let i = 0; i < output.lineCount(); i++) {
            output.indentLine(i, 'smart');
        }

        console.setValue('OK');
    }
}
