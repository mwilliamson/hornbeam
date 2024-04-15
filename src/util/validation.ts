export type ValidationResult<T> =
  | {type: "valid", value: T}
  | {type: "invalid", errors: ReadonlyArray<ValidationError>};

export interface ValidationError {
  elementId: string;
  inlineText: string;
  summaryText: string;
}
