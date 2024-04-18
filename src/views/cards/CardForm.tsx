import { useId, useState } from "react";

import { CardAddRequest, CardSet, CategorySet } from "../../app";
import { ValidationError, ValidationResult } from "../../util/validation";
import CategorySelect from "../categories/CategorySelect";
import Input from "../widgets/Input";
import { ValidationErrorsInlineView } from "../validation-views";
import "./CardForm.scss";

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
      <label className="CardForm-ControlLabel" htmlFor={textControlId}>
        Text
      </label>
      <div className="CardForm-Control">
        <Input
          autoFocus
          id={textControlId}
          onChange={text => onChange({...state, text})}
          value={state.text}
        />
        <ValidationErrorsInlineView elementId={textControlId} errors={errors} />
      </div>
      <label className="CardForm-ControlLabel">
        Parent
      </label>
      <div className="CardForm-Control">
        {parent === null ? "None" : `${parent.text} (#${parent.number})`}
      </div>
      <label className="CardForm-ControlLabel">Category</label>
      <div className="CardForm-Control">
        <CategorySelect
          availableCategories={allCategories.availableCategories()}
          onChange={categoryId => onChange({...state, categoryId})}
          value={state.categoryId}
        />
        <ValidationErrorsInlineView elementId={categoryControlId} errors={errors} />
      </div>
    </div>
  );
}
