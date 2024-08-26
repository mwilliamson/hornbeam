export function assertNeverWithDefault<T>(value: never, defaultValue: T): T {
  // TODO: log error
  return defaultValue;
}

export function assertNever(value: never): never {
  // TODO: log error
  throw new Error("unexpected value: " + value);
}
