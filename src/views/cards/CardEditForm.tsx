import { useState } from "react";

import { CategorySet } from "../../app";
import { Card, CardSet } from "../../app/cards";
import { ValidationError } from "../../util/validation";
import { ValidationErrorsSummaryView } from "../validation-views";
import Form from "../widgets/Form";
import CardForm, { ValidCardFormValues, useCardFormState, validateCardForm } from "./CardForm";

interface CardEditModalProps {
  allCards: CardSet;
  allCategories: CategorySet;
  card: Card;
  onCardSave: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
}

export default function CardEditModal(props: CardEditModalProps) {
  const {allCards, allCategories, card, onCardSave, onClose} = props;

  const [errors, setErrors] = useState<ReadonlyArray<ValidationError>>([]);
  const [formState, setFormState] = useCardFormState(card);

  const handleSubmit = async () => {
    const result = validateCardForm(formState);

    if (result.isValid) {
      setErrors([]);
      await onCardSave(result.value);
    } else {
      setErrors(result.errors);
    }
  };

  return (
    <Form className="p-md" onSubmit={handleSubmit}>
      <h2>Edit Card</h2>
      <ValidationErrorsSummaryView errors={errors} />
      <CardForm
        allCards={allCards}
        allCategories={allCategories}
        errors={errors}
        onStateChange={value => setFormState(value)}
        state={formState}
      />
      <Form.MainButtons onCancel={onClose} submitText="Save Card" />
    </Form>
  );
}
