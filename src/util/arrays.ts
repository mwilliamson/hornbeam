import { keyBy } from "./maps";

export function mapNotNull<T, R>(
  array: ReadonlyArray<T>,
  func: (element: T) => R | null,
): Array<R> {
  const result: Array<R> = [];

  for (const element of array) {
    const transformed = func(element);
    if (transformed !== null) {
      result.push(transformed);
    }
  }

  return result;
}

export function reorder<T>(
  values: ReadonlyArray<T>,
  key: (value: T) => string,
  reorderedKeys: ReadonlyArray<string>,
) {
  const valuesByKey = keyBy(values, key);

  const allKeys = [
    ...reorderedKeys,
    ...values.map(key),
  ];

  return mapNotNull(allKeys, key => {
    const value = valuesByKey.get(key);
    if (value === undefined) {
      return null;
    } else {
      valuesByKey.delete(key);
      return value;
    }
  });

}
