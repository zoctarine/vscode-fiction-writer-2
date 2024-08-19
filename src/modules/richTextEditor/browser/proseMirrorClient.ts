import {EditorState} from "prosemirror-state";
import {EditorView} from "prosemirror-view";
import {exampleSetup} from "prosemirror-example-setup";
import {gapCursor} from "prosemirror-gapcursor";
import {highlightPlugin, HighlightPluginOptions} from './proseMirrorUtils'
import {
    schema,
    fileParser,
    fileSerializer,
} from "../utils/fileExtensions";

import "./proseMirrorEditor.css";

const vscode = (globalThis as any).acquireVsCodeApi();
const vscodeState = vscode.getState();
const previousState = vscodeState?.text || "";
let doc = fileParser.parse(previousState);
let typing = window.performance.now();
let scrolbarrVisible = true;
const originalScrolbarColor = document.querySelector("html")!.style.scrollbarColor;
let options = vscodeState?.options ?? {
    highlight: {
        highlightType: 'paragraph'
    }
};

const hideScrollbarSubs = setInterval(() => {
    if (typing + 2000 < window.performance.now()) {
        if (!scrolbarrVisible) {
            document.querySelector("html")!.style.scrollbarColor = originalScrolbarColor;
            scrolbarrVisible = !scrolbarrVisible;
        }
    } else {
        if (scrolbarrVisible) {
            document.querySelector("html")!.style.scrollbarColor = "transparent transparent";
            scrolbarrVisible = !scrolbarrVisible;
        }
    }
}, 2000);

const editor = new EditorView(document.querySelector("#editor"), {
    state: createState(),
    dispatchTransaction(transaction) {
        let newState = editor.state.apply(transaction);
        editor.updateState(newState);
        if (transaction.docChanged) {
            typing = window.performance.now();
            let changes: any = [];
            changes = transaction.steps.map((step) => step.toJSON());
            vscode.setState({text: fileSerializer.serialize(newState.doc), options});
            vscode.postMessage({
                command: 'update',
                text: changes
            });
        }
    }
});

function createState() {
    return EditorState.create({
        doc: doc,
        plugins: exampleSetup({schema: schema})
            .concat(highlightPlugin(options.highlight)),
    });
}

function updateEditor(text?: string, newOptions? : {highlight: HighlightPluginOptions}) {
    const vsState = vscode.getState() ?? {text:"", options:{}};
    if (text) {
        doc = fileParser.parse(text);
        vsState.text = text;
    }
    if (newOptions){
        options = newOptions;
        vsState.options = newOptions;
    }
    editor.updateState(createState());
    vscode.setState(vsState);
}

// Handle messages sent from the extension to the webview
window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
        case 'update':
            updateEditor(message.text, message.options);
            return;
    }
});

document.querySelector("#toolbar")!.addEventListener("mouseenter", (e) => {
    const elem = document.querySelector(".ProseMirror-menubar") as HTMLElement;
    elem!.style.visibility = "visible";
    elem!.style.transition = "opacity 0.5s linear 0s";
    elem!.style.opacity = "0.9";
});

document.querySelector("#editor")!.addEventListener("click", (e) => {
    const elem = document.querySelector(".ProseMirror-menubar") as HTMLElement;
    elem!.style.transition = "opacity 0s linear 0.5s";
    elem!.style.opacity = "0";
    elem!.style.visibility = "hidden";
});
