import { useState } from "react";

import { CardAddRequest, CardSet, CategorySet } from "../../app";
import Form from "../widgets/Form";
import { ValidationError } from "../../util/validation";
import CardForm, { ValidCardFormValues, useCardFormState, validateCardForm } from "./CardForm";
import { ValidationErrorsSummaryView } from "../validation-views";

interface CardAddFormProps {
  allCards: CardSet;
  allCategories: CategorySet;
  initialValue: Partial<CardAddRequest>;
  onCardAdd: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
}

export default function CardAddForm(props: CardAddFormProps) {
  const {allCards, allCategories, onCardAdd, onClose, initialValue} = props;

  const [errors, setErrors] = useState<ReadonlyArray<ValidationError>>([]);
  const [formState, setFormState] = useCardFormState(initialValue);

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
    <Form className="p-md" onSubmit={handleSubmit}>
      <h2>Add Card</h2>
      <ValidationErrorsSummaryView errors={errors} />
      <CardForm
        allCards={allCards}
        allCategories={allCategories}
        errors={errors}
        onStateChange={value => setFormState(value)}
        state={formState}
      />
      <Form.MainButtons onCancel={onClose} submitText="Add Card" />
    </Form>
  );
}
