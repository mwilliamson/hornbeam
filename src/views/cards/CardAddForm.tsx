import { useState } from "react";

import { CardSet } from "../../app/cards";
import { CategorySet } from "../../app/categories";
import { ColorSet } from "../../app/colors";
import { ValidationError } from "../../util/validation";
import { ValidationErrorsSummaryView } from "../validation-views";
import Form from "../widgets/Form";
import CardForm, { CardFormInitialState, ValidCardFormValues, useCardFormState, validateCardForm } from "./CardForm";

interface CardAddFormProps {
  appSnapshot: CardSet & CategorySet & ColorSet;
  initialValue: CardFormInitialState;
  onCardAdd: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
}

export default function CardAddForm(props: CardAddFormProps) {
  const {appSnapshot, onCardAdd, onClose, initialValue} = props;

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
    <Form onSubmit={handleSubmit}>
      <ValidationErrorsSummaryView errors={errors} />
      <CardForm
        allCategories={appSnapshot}
        allColors={appSnapshot}
        errors={errors}
        onStateChange={value => setFormState(value)}
        state={formState}
      />
      <Form.MainButtons onCancel={onClose} submitText="Add card" />
    </Form>
  );
}
