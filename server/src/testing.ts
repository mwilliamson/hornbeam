import "disposablestack/auto";
import path from "node:path";
import { suite } from "mocha";

export function fileSuite(filename: string, callback: () => (Promise<void> | void)) {
  const projectRoot = path.normalize(path.join(__dirname, "../.."));
  suite(path.relative(projectRoot, filename), callback);
}

const disposables = new AsyncDisposableStack();

export function use(disposable: AsyncDisposable): void {
  disposables.use(disposable);
}

export function defer(f: () => Promise<void>): void {
  disposables.defer(f);
}

export const mochaHooks = {
  async afterAll() {
    await disposables.disposeAsync();
  }
};
