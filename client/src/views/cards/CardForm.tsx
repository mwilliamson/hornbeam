import { useId, useState } from "react";

import { Card, validateCardCategory, validateCardText } from "hornbeam-common/src/app/cards";
import { Category } from "hornbeam-common/src/app/categories";
import { ColorSet } from "hornbeam-common/src/app/colors";
import { ValidationError, ValidationResult } from "hornbeam-common/src/util/validation";
import CategorySelect from "../categories/CategorySelect";
import { ValidationErrorsInlineView } from "../validation-views";
import ControlGroup from "../widgets/ControlGroup";
import ControlLabel from "../widgets/ControlLabel";
import Input from "../widgets/Input";
import CardParentView from "./CardParentView";

export type CardFormInitialState = Pick<CardFormState, "parentCard">;

export interface CardFormState {
  controlIds: {
    text: string;
    category: string;
  };
  categoryId: string | null;
  // Storing the parent card, rather than just the ID, means it can become
  // stale, but allows us to have clearly delineated fetch boundaries.
  parentCard: Card | null;
  text: string;
}

export interface ValidCardFormValues {
  categoryId: string;
  parentCardId: string | null;
  text: string;
}

export function useCardFormState(
  initialState: CardFormInitialState,
): [CardFormState, (newState: CardFormState) => void] {
  const textControlId = useId();
  const categoryControlId = useId();

  return useState((): CardFormState => ({
    controlIds: {
      text: textControlId,
      category: categoryControlId,
    },
    categoryId: null,
    parentCard: initialState.parentCard,
    text: "",
  } satisfies CardFormState));
}

export function validateCardForm(value: CardFormState): ValidationResult<ValidCardFormValues> {
  const {controlIds, categoryId, parentCard, text} = value;

  // The order of fields will determine the order of error messages.
  return ValidationResult.flatten({
    text: validateCardText(controlIds.text, text),
    categoryId: validateCardCategory(controlIds.category, categoryId),
    parentCardId: ValidationResult.valid(parentCard === null ? null : parentCard.id),
  });
}

interface CardFormProps {
  allColors: ColorSet;
  availableCategories: ReadonlyArray<Category>;
  errors: ReadonlyArray<ValidationError>;

  onStateChange: (value: CardFormState) => void;
  state: CardFormState;
}

export default function CardForm(props: CardFormProps) {
  const {allColors, availableCategories, errors, onStateChange: onChange, state} = props;

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
        <CardParentView parentCard={state.parentCard} />
      </ControlGroup>
      <ControlLabel>Category</ControlLabel>
      <ControlGroup>
        <CategorySelect
          allColors={allColors}
          availableCategories={availableCategories}
          onChange={categoryId => onChange({...state, categoryId})}
          value={state.categoryId}
        />
        <ValidationErrorsInlineView elementId={categoryControlId} errors={errors} />
      </ControlGroup>
    </div>
  );
}
