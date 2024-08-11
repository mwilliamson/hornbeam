import { ValidationError } from "../util/validation";
import "./validation-views.scss";

interface ValidationErrorsSummaryViewProps {
  errors: ReadonlyArray<ValidationError>;
}

export function ValidationErrorsSummaryView(props: ValidationErrorsSummaryViewProps) {
  const {errors} = props;

  return errors.length > 0 && (
    <ul className="validation-views-ValidationErrorsSummaryView">
      {errors.map((error, errorIndex) => (
        <li key={errorIndex}>
          {error.summaryText}
        </li>
      ))}
    </ul>
  );
}

interface ValidationErrorsInlineViewProps {
  elementId: string;
  errors: ReadonlyArray<ValidationError>;
}

export function ValidationErrorsInlineView(props: ValidationErrorsInlineViewProps) {
  const {elementId, errors} = props;

  const relevantErrors = errors.filter(error => error.elementId === elementId);

  return (
    <ul className="validation-views-ValidationErrorsInlineView">
      {relevantErrors.map((error, errorIndex) => (
        <li key={errorIndex}>
          {error.inlineText}
        </li>
      ))}
    </ul>
  );
}
