import {EditorView, keymap,drawSelection} from "@codemirror/view";
import {EditorState, Compartment} from "@codemirror/state";
import {defaultKeymap} from "@codemirror/commands";
import {markdown} from "@codemirror/lang-markdown";
import {languages} from "@codemirror/language-data";

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

import * as view from '@codemirror/view';
import * as  state from '@codemirror/state';
import * as  language from '@codemirror/language';
import * as  commands from '@codemirror/commands';
import * as  search from '@codemirror/search';
import * as  autocomplete from '@codemirror/autocomplete';
import * as  lint from '@codemirror/lint';

/**
This is an extension value that just pulls together a number of
extensions that you might want in a basic editor. It is meant as a
convenient helper to quickly set up CodeMirror without installing
and importing a lot of separate packages.

Specifically, it includes...

 - [the default command bindings](https://codemirror.net/6/docs/ref/#commands.defaultKeymap)
 - [line numbers](https://codemirror.net/6/docs/ref/#view.lineNumbers)
 - [special character highlighting](https://codemirror.net/6/docs/ref/#view.highlightSpecialChars)
 - [the undo history](https://codemirror.net/6/docs/ref/#commands.history)
 - [a fold gutter](https://codemirror.net/6/docs/ref/#language.foldGutter)
 - [custom selection drawing](https://codemirror.net/6/docs/ref/#view.drawSelection)
 - [drop cursor](https://codemirror.net/6/docs/ref/#view.dropCursor)
 - [multiple selections](https://codemirror.net/6/docs/ref/#state.EditorState^allowMultipleSelections)
 - [reindentation on input](https://codemirror.net/6/docs/ref/#language.indentOnInput)
 - [the default highlight style](https://codemirror.net/6/docs/ref/#language.defaultHighlightStyle) (as fallback)
 - [bracket matching](https://codemirror.net/6/docs/ref/#language.bracketMatching)
 - [bracket closing](https://codemirror.net/6/docs/ref/#autocomplete.closeBrackets)
 - [autocompletion](https://codemirror.net/6/docs/ref/#autocomplete.autocompletion)
 - [rectangular selection](https://codemirror.net/6/docs/ref/#view.rectangularSelection) and [crosshair cursor](https://codemirror.net/6/docs/ref/#view.crosshairCursor)
 - [active line highlighting](https://codemirror.net/6/docs/ref/#view.highlightActiveLine)
 - [active line gutter highlighting](https://codemirror.net/6/docs/ref/#view.highlightActiveLineGutter)
 - [selection match highlighting](https://codemirror.net/6/docs/ref/#search.highlightSelectionMatches)
 - [search](https://codemirror.net/6/docs/ref/#search.searchKeymap)
 - [linting](https://codemirror.net/6/docs/ref/#lint.lintKeymap)

(You'll probably want to add some language package to your setup
too.)

This package does not allow customization. The idea is that, once
you decide you want to configure your editor more precisely, you
take this package's source (which is just a bunch of imports and
an array literal), copy it into your own code, and adjust it as
desired.
*/
const basicSetup = [
    //view.lineNumbers(),
    //view.highlightActiveLineGutter(),
    view.highlightSpecialChars(),
    commands.history(),
    //language.foldGutter(),
    view.drawSelection(),
    view.dropCursor(),
    state.EditorState.allowMultipleSelections.of(true),
    language.indentOnInput(),
    language.syntaxHighlighting(language.defaultHighlightStyle, { fallback: true }),
    language.bracketMatching(),
    autocomplete.closeBrackets(),
    //autocomplete.autocompletion(),
    view.rectangularSelection(),
    view.crosshairCursor(),
    //view.highlightActiveLine(),
    search.highlightSelectionMatches(),
    view.keymap.of([
        ...autocomplete.closeBracketsKeymap,
        ...commands.defaultKeymap,
        ...search.searchKeymap,
        ...commands.historyKeymap,
        ...language.foldKeymap,
        ...autocomplete.completionKeymap,
        ...lint.lintKeymap
    ])
];

Object.defineProperty(exports, 'EditorView', {
    enumerable: true,
    get: function () { return view.EditorView; }
});
Object.defineProperty(exports, 'EditorState', {
    enumerable: true,
    get: function () { return state.EditorState; }
});


const vscode = (globalThis as any).acquireVsCodeApi();
const previousState = vscode.getState()?.text || "";

let myView = new EditorView({
    doc: "# Hello\n\nThis is a simple example of a CodeMirror editor in a webview.",
    
    extensions: [
        basicSetup,
        markdown({codeLanguages: languages}),
        EditorView.lineWrapping,
        drawSelection({cursorBlinkRate: 0})
    ],
    parent: document.querySelector("#editor")!
  });
  
  Array.prototype.forEach.call(document.querySelectorAll(".CodeMirror"),
  e => e.CodeMirror.setOption("cursorBlinkRate", 0))

