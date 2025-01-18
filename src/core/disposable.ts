/**
 * A disposable-like interface, that can be used by vscode disposables to dispose of resources.
 * We don't use vscode.Disposable directly, because we try to avoid direct dependency on vscode where we can
 */
export interface IDisposable {
	dispose(): void;
}

export abstract class DisposeManager implements IDisposable {

	private _disposables: { dispose(): void }[] = [];

	protected manageDisposable(...disposable: IDisposable[]) {
		this._disposables.push(...disposable);
	}

	protected disposeAndForget(...disposable: (IDisposable | undefined)[]) {
		disposable.forEach(d => {
			if (!d) return;

			const index = this._disposables.indexOf(d);
			if (index >= 0) {
				this._disposables.splice(index, 1);
				d?.dispose();
			}
		});
	}


	dispose() {
		const errors = [];
		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				try {
					disposable.dispose();
				} catch (e) {
					errors.push(e);
				}
			}
		}

		if (errors.length) {
			console.error("Errors while disposing resources", errors);
		}
	}
}
