export function keyBy<T, K>(values: ReadonlyArray<T>, key: (value: T) => K): Map<K, T> {
  return new Map(values.map(value => [key(value), value]));
}
