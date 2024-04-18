export type ValidationResult<T> =
  | {type: "valid", value: T}
  | {type: "invalid", errors: ReadonlyArray<ValidationError>};

export const ValidationResult = {
  valid: <T>(value: T): ValidationResult<T> =>
    ({type: "valid", value}),

  invalid: (errors: ReadonlyArray<ValidationError>): ValidationResult<never> =>
    ({type: "invalid", errors}),
};

export interface ValidationError {
  elementId: string;
  inlineText: string;
  summaryText: string;
}
