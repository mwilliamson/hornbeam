export default function intersperse<T, S>(
  array: ReadonlyArray<T>,
  separator: S,
): ReadonlyArray<T | S> {
  const result: Array<T | S> = [];

  array.forEach((element, index) => {
    if (index !== 0) {
      result.push(separator);
    }
    result.push(element);
  });

  return result;
}
