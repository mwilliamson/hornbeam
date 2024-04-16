import { useId, useState } from "react";

import { CardSet, Category } from "../app";
import ActionModal from "./widgets/ActionModal";
import { ValidationError } from "../util/validation";
import CardForm, { ValidCardFormValues, useCardFormState, validateCardForm } from "./CardForm";
import { ValidationErrorsSummaryView } from "./validation-views";

interface CardAddModalProps {
  allCards: CardSet;
  availableCategories: ReadonlyArray<Category>;
  initialParentCardId: string | null;
  onCardAdd: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
}

export default function CardAddModal(props: CardAddModalProps) {
  const {allCards, availableCategories, onCardAdd, onClose, initialParentCardId} = props;

  const [errors, setErrors] = useState<ReadonlyArray<ValidationError>>([]);
  const [formState, setFormState] = useCardFormState({parentCardId: initialParentCardId});

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
          allCards={allCards}
          availableCategories={availableCategories}
          errors={errors}
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
