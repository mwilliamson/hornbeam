export type ValidationResult<T> =
  | {type: "valid", value: T}
  | {type: "invalid", errors: ReadonlyArray<ValidationError>};

export const ValidationResult = {
  valid: <T>(value: T): ValidationResult<T> =>
    ({type: "valid", value}),

  invalid: (errors: ReadonlyArray<ValidationError>): ValidationResult<never> =>
    ({type: "invalid", errors}),

  flatten: <T extends {[key: string]: ValidationResult<unknown>}>(results: T): ValidationResult<{[K in keyof T]: T[K] extends ValidationResult<infer V> ? V : never }> => {
    const flattenedValue: {[key: string]: unknown} = {};
    const errors: Array<ValidationError> = [];

    for (const [key, result] of Object.entries(results)) {
      if (result.type === "valid") {
        flattenedValue[key] = result.value;
      } else {
        for (const error of result.errors) {
          errors.push(error);
        }
      }
    }

    if (errors.length === 0) {
      return ValidationResult.valid(
        flattenedValue as {[K in keyof T]: T[K] extends ValidationResult<infer V> ? V : never },
      );
    } else {
      return ValidationResult.invalid(errors);
    }
  }
};

export interface ValidationError {
  elementId: string;
  inlineText: string;
  summaryText: string;
}
