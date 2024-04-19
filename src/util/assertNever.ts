export default function assertNever<T>(value: never, defaultValue: T): T {
  // TODO: log error
  return defaultValue;
}
