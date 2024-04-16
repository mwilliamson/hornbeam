import { useId, useState } from "react";

import { Card, Category } from "../app";
import ActionModal from "./widgets/ActionModal";
import { ValidationError } from "../util/validation";
import CardForm, { ValidCardFormValues, useCardFormState, validateCardForm } from "./CardForm";
import { ValidationErrorsSummaryView } from "./validation-views";

interface CardAddModalProps {
  availableCategories: ReadonlyArray<Category>;
  onCardAdd: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
  parent: Card | null;
}

export default function CardAddModal(props: CardAddModalProps) {
  const {availableCategories, onCardAdd, onClose, parent} = props;

  const [errors, setErrors] = useState<ReadonlyArray<ValidationError>>([]);
  const [formState, setFormState] = useCardFormState();

  const modalLabelElementId = useId();

  const handleSubmit = async () => {
    const result = validateCardForm(formState);

    if (result.type === "valid") {
      setErrors([]);
      await onCardAdd(result.value);
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
        <h2 id={modalLabelElementId}>Add Card</h2>
      </ActionModal.Header>
      <ActionModal.Body>
        <ValidationErrorsSummaryView errors={errors} />
        <CardForm
          availableCategories={availableCategories}
          errors={errors}
          parent={parent}
          onStateChange={value => setFormState(value)}
          state={formState}
        />
      </ActionModal.Body>
      <ActionModal.Footer>
        <ActionModal.MainButtons onCancel={onClose} submitText="Add Card" />
      </ActionModal.Footer>
    </ActionModal>
  );
}
