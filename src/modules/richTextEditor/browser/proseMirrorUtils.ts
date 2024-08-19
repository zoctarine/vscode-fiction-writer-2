import {Plugin, PluginKey, Selection} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';

const highlightKey = new PluginKey('highlight-paragraph');

function createDecorations(start: number, end: number, docSize: number) {
    return [
        Decoration.inline(0, start, {class: 'blurred-text'}),
        Decoration.inline(end, docSize, {class: 'blurred-text'})
    ];
}

function getSentenceBoundaries(selection: Selection) {
    const {$from, $to} = selection;
    const sentenceTerminators = ['.', ':', '?', '!', '\n', '\r'];

    let selNodeBefore = $from.start($from.depth);
    let start = selNodeBefore;
    let text = $from.node($from.depth).textContent;
    for (start = selection.from - selNodeBefore; start > 0; start--) {
        if (sentenceTerminators.includes(text[start])) {
            start++; // make sure we skip the sentence terminator if found
            break;
        }
    }
    start += selNodeBefore;

    let selNodeAfter = $to.start($to.depth);
    let end = selNodeAfter;
    text = $to.node($to.depth).textContent;
    for (end = selection.to - selNodeAfter; end < text.length; end++) {
        if (sentenceTerminators.includes(text[end])) {
            end++; // make sure we include the sentence terminator if found
            break;
        }
    }
    end += selNodeAfter;
    return {start, end};
}

function getParagraphBoundaries(selection: Selection) {
    const {$from, $to} = selection;
    return {
        start: $from.start($from.depth),
        end: $to.end($to.depth)
    };
}


export interface HighlightPluginOptions{
    highlightType: string;
}

function highlightPlugin(options: HighlightPluginOptions) {
    return new Plugin({
        key: highlightKey,
        state: {
            init: (_, {doc}) => DecorationSet.empty,
            apply(tr, old) {
                if (!tr.docChanged && !tr.selectionSet) return old;
                const {selection, doc} = tr;
                let decorations = DecorationSet.empty;
                if (options.highlightType === 'none') return decorations;

                try {
                    let {start, end} =
                        options.highlightType === 'paragraph'
                        ? getParagraphBoundaries(selection)
                        : getSentenceBoundaries(selection);

                    decorations = DecorationSet.create(doc, createDecorations(start, end, doc.content.size));
                } catch (err) {
                    console.warn("Could not highlight nodes", err);
                }
                return decorations;
            }
        },
        props: {
            decorations(state) {
                return this.getState(state);
            }
        }
    });
}

export {highlightPlugin};