/**
 * A disposable-like interface, that can be used by vscode disposables to dispose of resources.
 * We don't use vscode.Disposable directly, because we try to avoid direct dependency on vscode where we can
 */
interface IDisposable {
    dispose(): void;
}

export abstract class DisposeManager implements IDisposable {

    private disposables: { dispose():void }[] = [];

        protected disposable(disposable: IDisposable) {
            this.disposables.push(disposable);
        }

    dispose() {
        this.disposables.forEach(d => {
                // Don't want to stop disposing of the rest of the disposables if one fails
                try {
                    d.dispose();
                } catch (e) {
                    console.error(e);
                }
            }
        );
    }
}
