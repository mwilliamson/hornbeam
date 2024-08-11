import { useState } from "react";

import { Category } from "hornbeam-common/src/app/categories";
import { ColorSet } from "hornbeam-common/src/app/colors";
import { ValidationError } from "hornbeam-common/src/util/validation";
import { ValidationErrorsSummaryView } from "../validation-views";
import Form from "../widgets/Form";
import CardForm, { CardFormInitialState, ValidCardFormValues, useCardFormState, validateCardForm } from "./CardForm";

interface CardAddFormProps {
  allColors: ColorSet;
  availableCategories: ReadonlyArray<Category>;
  initialValue: CardFormInitialState;
  onCardAdd: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
}

export default function CardAddForm(props: CardAddFormProps) {
  const {allColors, availableCategories, initialValue, onCardAdd, onClose} = props;

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
        allColors={allColors}
        availableCategories={availableCategories}
        errors={errors}
        onStateChange={value => setFormState(value)}
        state={formState}
      />
      <Form.MainButtons onCancel={onClose} submitText="Add card" />
    </Form>
  );
}
