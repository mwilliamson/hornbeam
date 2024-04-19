import { useState } from "react";

import { CardAddRequest, CardSet } from "../../app/cards";
import { CategorySet } from "../../app/categories";
import { ColorSet } from "../../app/colors";
import { ValidationError } from "../../util/validation";
import { ValidationErrorsSummaryView } from "../validation-views";
import Form from "../widgets/Form";
import CardForm, { ValidCardFormValues, useCardFormState, validateCardForm } from "./CardForm";

interface CardAddFormProps {
  appState: CardSet & CategorySet & ColorSet;
  initialValue: Partial<CardAddRequest>;
  onCardAdd: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
}

export default function CardAddForm(props: CardAddFormProps) {
  const {appState, onCardAdd, onClose, initialValue} = props;

  const [errors, setErrors] = useState<ReadonlyArray<ValidationError>>([]);
  const [formState, setFormState] = useCardFormState(initialValue);

  const handleSubmit = async () => {
    const result = validateCardForm(formState);

    if (result.isValid) {
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
        appState={appState}
        errors={errors}
        onStateChange={value => setFormState(value)}
        state={formState}
      />
      <Form.MainButtons onCancel={onClose} submitText="Add Card" />
    </Form>
  );
}
