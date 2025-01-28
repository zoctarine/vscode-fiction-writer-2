import vscode from 'vscode';
import {FictionWriter} from '../constants';
import {processorFactory} from './processors';
import {StateManager} from '../state';
import {FwMarkdownFileFormat} from './formatting';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import {visit} from 'unist-util-visit';
import {log} from '../logging';
import remarkStringify from 'remark-stringify';

export class MarkdownSymbolProvider implements vscode.DocumentSymbolProvider {
	constructor(private stateManager: StateManager) {

	}

	provideDocumentSymbols(
		document: vscode.TextDocument,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.DocumentSymbol[]> {

		return new Promise((resolve, reject) => {
			setTimeout(() => {
				if (token.isCancellationRequested) {
					resolve([]); // Ignore the request if canceled
				} else {
					resolve(this.generateSymbols(document));
				}
			}, 1000); // 300ms delay
		});
	}

	private generateSymbols(document: vscode.TextDocument) {

		if (!document) return;

		let astTree = unified()
			.use(remarkParse)
			.use(remarkFrontmatter, ['yaml'])
			.parse(document.getText());

		const symbols: vscode.DocumentSymbol[] = [];

		// Begin processing the tree with a null parent
		function walk(nodes: any[]): vscode.DocumentSymbol[] {
			const stack: { depth: number; symbol: vscode.DocumentSymbol }[] = [];
			const result: vscode.DocumentSymbol[] = [];

			for (const node of nodes) {
				if (node.type === 'yaml'){
					result.push(new vscode.DocumentSymbol(
						"yaml", // The name of the heading
						``, // Description based on depth
						vscode.SymbolKind.Enum, // Use `Namespace` for headings
						new vscode.Range(0,0,0,0),
						new vscode.Range(0,0,0,0)
					));
				}
				log.tmp("NODE", node.type);
				if (!node || node.type !== 'heading' || !node.depth || !node.position) {
					continue; // Skip non-heading nodes or nodes without `depth` or `position`
				}

				// Extract heading text
				const textNode = node.children.find((child: any) => child.type === 'text');
				const headingText = textNode?.value || 'Untitled';

				// Create a symbol for the current heading
				const headingSymbol = new vscode.DocumentSymbol(
					headingText, // The name of the heading
					`H${node.depth}`, // Description based on depth
					vscode.SymbolKind.String, // Use `Namespace` for headings
					new vscode.Range(
						node.position.start.line - 1,
						node.position.start.column - 1,
						node.position.end.line - 1,
						node.position.end.column - 1
					),
					new vscode.Range(
						node.position.start.line - 1,
						node.position.start.column - 1,
						node.position.end.line - 1,
						node.position.end.column - 1
					)
				);

				// Determine where this heading fits in the hierarchy
				while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
					stack.pop(); // Pop headings that are not parents of the current node
				}

				if (stack.length === 0) {
					// Top-level heading
					result.push(headingSymbol);
				} else {
					// Nested under the last item in the stack
					stack[stack.length - 1].symbol.children.push(headingSymbol);
				}

				// Push current heading onto the stack
				stack.push({ depth: node.depth, symbol: headingSymbol });
			}

			return result; // Return the final hierarchy
		}
		log.tmp(symbols);

		// for (const kind of Object.values(vscode.SymbolKind).filter(value => typeof value === 'number')) {
		// 	const headerSymbol = new vscode.DocumentSymbol(vscode.SymbolKind[kind],
		// 		``,
		// 		kind as vscode.SymbolKind,
		// 		new vscode.Range(0, 0, 0, 0),
		// 		new vscode.Range(0, 0, 0, 0)
		// 	);
		// 	symbols.push(headerSymbol);
		// }
		// Process the top-level tree
		const hierarchicalSymbols = walk(astTree.children || []);
		symbols.push(...hierarchicalSymbols);

		return symbols;
	}
}


export function registerMarkdownDocumentSymbols(stateManager: StateManager): vscode.Disposable {
	const provider = vscode.languages.registerDocumentSymbolProvider(
		{language: FictionWriter.languages.FW_MARKDOWN},
		new MarkdownSymbolProvider(stateManager)
	);
	return vscode.Disposable.from(provider);
}
