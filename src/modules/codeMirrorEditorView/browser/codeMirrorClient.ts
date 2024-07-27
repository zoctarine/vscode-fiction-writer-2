import { EditorView, ViewUpdate, keymap, drawSelection } from "@codemirror/view";
import { EditorState, TransactionSpec } from "@codemirror/state";
import { defaultKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import * as view from '@codemirror/view';
import * as  state from '@codemirror/state';
import * as  language from '@codemirror/language';
import * as  commands from '@codemirror/commands';
import * as  search from '@codemirror/search';
import * as  autocomplete from '@codemirror/autocomplete';
import * as  lint from '@codemirror/lint';

import './codeMirrorEditor.css';

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
const doc = vscode.getState()?.text || "";
let typing = window.performance.now();
const extensions = [
    basicSetup,
    markdown({ codeLanguages: languages }),
    EditorView.lineWrapping,
    drawSelection({ cursorBlinkRate: 0 }),
    EditorView.updateListener.of((v: ViewUpdate) => {
        if (v.docChanged) {
            typing = window.performance.now();

            let changes = v.transactions
                .map(t => t.changes.toJSON());

            vscode.setState({ text: v.state.doc.toString() });
            vscode.postMessage({
                command: 'update',
                text: changes
            });
        }
    })
];

let myView = new EditorView({
    doc: doc,
    extensions: extensions,
    parent: document.querySelector("#editor")!
});


function updateContent(text: string) {
    myView.setState(EditorState.create({
        doc: text,
        extensions: extensions
    }));
    vscode.setState({ text });
  }

window.addEventListener('message', event => {
  const message = event.data; // The json data that the extension sent
  switch (message.type) {
    case 'update':
      const text = message.text;
      // Update our webview's content
      updateContent(text);

      return;
  }
});



