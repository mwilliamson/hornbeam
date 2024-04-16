import { useState } from "react";

import { CardSet, Category } from "../../app";
import Form from "../widgets/Form";
import { ValidationError } from "../../util/validation";
import CardForm, { ValidCardFormValues, useCardFormState, validateCardForm } from "./CardForm";
import { ValidationErrorsSummaryView } from "../validation-views";

interface CardAddFormProps {
  allCards: CardSet;
  availableCategories: ReadonlyArray<Category>;
  initialParentCardId: string | null;
  onCardAdd: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
}

export default function CardAddForm(props: CardAddFormProps) {
  const {allCards, availableCategories, onCardAdd, onClose, initialParentCardId} = props;

  const [errors, setErrors] = useState<ReadonlyArray<ValidationError>>([]);
  const [formState, setFormState] = useCardFormState({parentCardId: initialParentCardId});

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
    <Form onSubmit={handleSubmit}>
      <h2>Add Card</h2>
      <ValidationErrorsSummaryView errors={errors} />
      <CardForm
        allCards={allCards}
        availableCategories={availableCategories}
        errors={errors}
        onStateChange={value => setFormState(value)}
        state={formState}
      />
      <Form.MainButtons onCancel={onClose} submitText="Add Card" />
    </Form>
  );
}
