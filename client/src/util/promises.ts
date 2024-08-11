export interface Deferred<T> {
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  promise: Promise<T>;
}

export function createDeferred<T>(): Deferred<T> {
  const deferred: Partial<Deferred<T>> = {};

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred as Deferred<T>;
}
