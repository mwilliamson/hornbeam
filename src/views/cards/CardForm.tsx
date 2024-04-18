import { useId, useState } from "react";

import { CardAddRequest, CardSet, CategorySet } from "../../app";
import { ValidationError, ValidationResult } from "../../util/validation";
import CategorySelect from "../categories/CategorySelect";
import ControlLabel from "../widgets/ControlLabel";
import ControlGroup from "../widgets/ControlGroup";
import Input from "../widgets/Input";
import { ValidationErrorsInlineView } from "../validation-views";

export interface CardFormState {
  controlIds: {
    text: string;
    category: string;
  };
  categoryId: string;
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
    categoryId: card?.categoryId ?? "",
    parentCardId: card?.parentCardId ?? null,
    text: card?.text ?? "",
  }));
}

export function validateCardForm(value: CardFormState): ValidationResult<ValidCardFormValues> {
  const {controlIds, categoryId, parentCardId, text} = value;

  const errors: Array<ValidationError> = [];

  if (text === "") {
    errors.push({
      elementId: controlIds.text,
      inlineText: "Enter the card text.",
      summaryText: "Card is missing text."
    });
  }

  if (categoryId === "") {
    errors.push({
      elementId: controlIds.category,
      inlineText: "Select a category.",
      summaryText: "Card is missing a category.",
    });
  }

  if (errors.length > 0) {
    return {type: "invalid", errors};
  } else {
    return {type: "valid", value: {categoryId, parentCardId, text}};
  }
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

  const parent = state.parentCardId === null
    ? null
    : allCards.findCardById(state.parentCardId);

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
        {parent === null ? "None" : `${parent.text} (#${parent.number})`}
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
