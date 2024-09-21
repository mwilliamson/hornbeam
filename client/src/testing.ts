import "disposablestack/auto";

const disposables = new AsyncDisposableStack();

export function use(disposable: AsyncDisposable): void {
  disposables.use(disposable);
}

export const mochaHooks = {
  async afterAll() {
    await disposables.disposeAsync();
  }
};
