import { useState } from "react";

import { Card, CardSet } from "../../app/cards";
import { CategorySet } from "../../app/categories";
import { ColorSet } from "../../app/colors";
import { ValidationError } from "../../util/validation";
import { ValidationErrorsSummaryView } from "../validation-views";
import Form from "../widgets/Form";
import CardForm, { ValidCardFormValues, useCardFormState, validateCardForm } from "./CardForm";

interface CardEditModalProps {
  appState: CardSet & CategorySet & ColorSet;
  card: Card;
  onCardSave: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
}

export default function CardEditModal(props: CardEditModalProps) {
  const {appState, card, onCardSave, onClose} = props;

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
        appState={appState}
        errors={errors}
        onStateChange={value => setFormState(value)}
        state={formState}
      />
      <Form.MainButtons onCancel={onClose} submitText="Save Card" />
    </Form>
  );
}
