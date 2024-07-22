import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import { gapCursor } from "prosemirror-gapcursor";
import {
  schema,
  customMarkdownSerializer,
  defaultMarkdownParser,
} from "../CustomEditor/fictionWriterMarkdown";

const vscode = (globalThis as any).acquireVsCodeApi();
// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.

const previousState = vscode.getState()?.text || "";
const doc = defaultMarkdownParser.parse(previousState);
console.log(doc);
const editor = new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: doc,
    plugins: exampleSetup({ schema: schema }).concat(gapCursor()),
  }),

  dispatchTransaction(transaction) {
    let newState = editor.state.apply(transaction);
    editor.updateState(newState);

    if (transaction.docChanged) {
      let changes: any = [];
      changes = transaction.steps.map((step) => step.toJSON());
      vscode.setState({ text: customMarkdownSerializer.serialize(newState.doc) });
      vscode.postMessage({
        command: 'update',
        text: changes
      });
    }
  }
});

function updateContent(text: string) {

  const doc = defaultMarkdownParser.parse(text);
  editor.updateState(EditorState.create({
    doc: doc,
    plugins: exampleSetup({ schema: schema }).concat(gapCursor()),
  }));
  vscode.setState({ text });
}

function saveContent(text: string) {
  console.log("saving content: ", text);
  vscode.postMessage({
    command: 'save',
    text: text
  });
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

    case 'saveRequest':
      console.log("Received: saveRequest");
      // Update our webview's content
      const content = customMarkdownSerializer.serialize(editor.state.doc);
      saveContent(content);
      // Then persist state information.
      // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
      vscode.setState({ text });
      return;
  }
});
