import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Node, Fragment } from "prosemirror-model";
import { exampleSetup } from "prosemirror-example-setup";
import { gapCursor } from "prosemirror-gapcursor";
import {
  schema,
  fileParser,
  fileSerializer,
} from "./utils/fileExtensions";

const vscode = (globalThis as any).acquireVsCodeApi();

const previousState = vscode.getState()?.text || "";
const doc = fileParser.parse(previousState);
let typing = window.performance.now();
let scrolbarrVisible = true;
const originalScrolbarColor = document.querySelector("html")!.style.scrollbarColor;
console.log(originalScrolbarColor);

const hideScrollbarSubs = setInterval(() =>{
  if (typing + 2000 < window.performance.now()) {
    if (!scrolbarrVisible) {
      document.querySelector("html")!.style.scrollbarColor = originalScrolbarColor;
      scrolbarrVisible = !scrolbarrVisible;
    }
  } else {
   if (scrolbarrVisible){
    document.querySelector("html")!.style.scrollbarColor = "transparent transparent";
    scrolbarrVisible = !scrolbarrVisible;
   }
  }
}, 2000);

const editor = new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: doc,
    plugins: exampleSetup({ schema: schema }).concat(gapCursor()),
  }),

  dispatchTransaction(transaction) {
    let newState = editor.state.apply(transaction);
    editor.updateState(newState);
    if (transaction.docChanged) {
      typing =  window.performance.now();
      let changes: any = [];
      changes = transaction.steps.map((step) => step.toJSON());
      vscode.setState({ text: fileSerializer.serialize(newState.doc) });
      vscode.postMessage({
        command: 'update',
        text: changes
      });
    }
  }
});

function updateContent(text: string) {

  const doc = fileParser.parse(text);
  editor.updateState(EditorState.create({
    doc: doc,
    plugins: exampleSetup({ schema: schema }),
  }));
  vscode.setState({ text });
}

// Handle messages sent from the extension to the webview
window.addEventListener('message', event => {
  const message = event.data; // The json data that the extension sent
  switch (message.type) {
    case 'update':
      const text = message.text;
      // Update our webview's content
      updateContent(text);
      // Then persist state information.
      // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
      vscode.setState({ text });
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
