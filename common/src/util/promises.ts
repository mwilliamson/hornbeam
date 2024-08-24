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

export async function asyncMapValues<TObj extends object, TResult extends {[key in keyof TObj]: unknown}>(
  obj: TObj,
  f: <K extends keyof TObj>(value: TObj[K]) => Promise<TResult[K]>,
): Promise<TResult> {
  const partialResult: Partial<TResult> = {};

  const entries = Object.entries(obj) as Array<[keyof TObj, TObj[keyof TObj]]>;
  const promises: Array<Promise<void>> = [];

  for (const [key, value] of entries) {
    promises.push(f(value).then(mappedValue => {
      partialResult[key] = mappedValue;
    }));
  }

  for (const promise of promises) {
    await promise;
  }

  return partialResult as TResult;
}
