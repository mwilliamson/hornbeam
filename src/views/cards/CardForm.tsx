import { useId, useState } from "react";

import { CardAddRequest, CardSet, CategorySet, validateCardCategory, validateCardText } from "../../app";
import { ValidationError, ValidationResult } from "../../util/validation";
import CategorySelect from "../categories/CategorySelect";
import ControlLabel from "../widgets/ControlLabel";
import ControlGroup from "../widgets/ControlGroup";
import Input from "../widgets/Input";
import { ValidationErrorsInlineView } from "../validation-views";
import CardParentView from "./CardParentView";

export interface CardFormState {
  controlIds: {
    text: string;
    category: string;
  };
  categoryId: string | null;
  parentCardId: string | null;
  text: string;
}

export interface ValidCardFormValues {
  categoryId: string;
  parentCardId: string | null;
  text: string;
}

// TODO: Partial<CardAddRequest> isn't quite right in that it allows fields we ignore (notably, the ID)
export function useCardFormState(
  card: Partial<CardAddRequest>,
): [CardFormState, (newState: CardFormState) => void] {
  const textControlId = useId();
  const categoryControlId = useId();

  return useState(() => ({
    controlIds: {
      text: textControlId,
      category: categoryControlId,
    },
    categoryId: card?.categoryId ?? null,
    parentCardId: card?.parentCardId ?? null,
    text: card?.text ?? "",
  }));
}

export function validateCardForm(value: CardFormState): ValidationResult<ValidCardFormValues> {
  const {controlIds, categoryId, parentCardId, text} = value;

  // The order of fields will determine the order of error messages.
  return ValidationResult.flatten({
    text: validateCardText(controlIds.text, text),
    categoryId: validateCardCategory(controlIds.category, categoryId),
    parentCardId: ValidationResult.valid(parentCardId),
  });
}

interface CardFormProps {
  allCards: CardSet;
  allCategories: CategorySet;
  errors: ReadonlyArray<ValidationError>;

  onStateChange: (value: CardFormState) => void;
  state: CardFormState;
}

export default function CardForm(props: CardFormProps) {
  const {allCards, allCategories, errors, onStateChange: onChange, state} = props;

  const {controlIds: {text: textControlId, category: categoryControlId}} = state;

  return (
    <div className="CardForm">
      <ControlLabel htmlFor={textControlId}>
        Text
      </ControlLabel>
      <ControlGroup>
        <Input
          autoFocus
          id={textControlId}
          onChange={text => onChange({...state, text})}
          value={state.text}
        />
        <ValidationErrorsInlineView elementId={textControlId} errors={errors} />
      </ControlGroup>
      <ControlLabel>
        Parent
      </ControlLabel>
      <ControlGroup>
        <CardParentView allCards={allCards} parentCardId={state.parentCardId} />
      </ControlGroup>
      <ControlLabel>Category</ControlLabel>
      <ControlGroup>
        <CategorySelect
          availableCategories={allCategories.availableCategories()}
          onChange={categoryId => onChange({...state, categoryId})}
          value={state.categoryId}
        />
        <ValidationErrorsInlineView elementId={categoryControlId} errors={errors} />
      </ControlGroup>
    </div>
  );
}
