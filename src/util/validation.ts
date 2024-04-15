export type ValidationResult<T, E> =
  | {type: "valid", value: T}
  | {type: "invalid", error: E};
