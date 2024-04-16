import { useId, useState } from "react";

import { Card, CardSet, Category } from "../app";
import ActionModal from "./widgets/ActionModal";
import { ValidationError } from "../util/validation";
import CardForm, { ValidCardFormValues, useCardFormState, validateCardForm } from "./CardForm";
import { ValidationErrorsSummaryView } from "./validation-views";

interface CardEditModalProps {
  allCards: CardSet;
  availableCategories: ReadonlyArray<Category>;
  card: Card;
  onCardSave: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
}

export default function CardEditModal(props: CardEditModalProps) {
  const {allCards, availableCategories, card, onCardSave, onClose} = props;

  const [errors, setErrors] = useState<ReadonlyArray<ValidationError>>([]);
  const [formState, setFormState] = useCardFormState(card);

  const modalLabelElementId = useId();

  const handleSubmit = async () => {
    const result = validateCardForm(formState);

    if (result.type === "valid") {
      setErrors([]);
      await onCardSave(result.value);
    } else {
      setErrors(result.errors);
    }
  };

  return (
    <ActionModal
      labelElementId={modalLabelElementId}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <ActionModal.Header>
        <h2 id={modalLabelElementId}>Edit Card</h2>
      </ActionModal.Header>
      <ActionModal.Body>
        <ValidationErrorsSummaryView errors={errors} />
        <CardForm
          allCards={allCards}
          availableCategories={availableCategories}
          errors={errors}
          onStateChange={value => setFormState(value)}
          state={formState}
        />
      </ActionModal.Body>
      <ActionModal.Footer>
        <ActionModal.MainButtons onCancel={onClose} submitText="Save Card" />
      </ActionModal.Footer>
    </ActionModal>
  );
}
