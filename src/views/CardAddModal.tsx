import { useId, useState } from "react";

import { Card, Category } from "../app";
import ActionModal from "./widgets/ActionModal";
import Button from "./widgets/Button";
import Input from "./widgets/Input";
import "./CardAddModal.scss";
import CategorySelect from "./controls/CategorySelect";
import { ValidationError, ValidationResult } from "../util/validation";

export interface ValidCardFormValues {
  categoryId: string;
  text: string;
}

interface CardAddModalProps {
  availableCategories: ReadonlyArray<Category>;
  onCardAdd: (values: ValidCardFormValues) => Promise<void>;
  onClose: () => void;
  parent: Card | null;
}

export default function CardAddModal(props: CardAddModalProps) {
  const {availableCategories, onCardAdd, onClose, parent} = props;

  const [errors, setErrors] = useState<ReadonlyArray<ValidationError>>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [text, setText] = useState("");

  const modalLabelElementId = useId();
  const textControlId = useId();
  const categoryControlId = useId();

  const validate = (): ValidationResult<ValidCardFormValues> => {
    const errors: Array<ValidationError> = [];

    if (categoryId === "") {
      errors.push({
        elementId: categoryControlId,
        inlineText: "Please select a category.",
        summaryText: "Card is missing a category.",
      });
    }

    if (errors.length > 0) {
      return {type: "invalid", errors};
    } else {
      return {type: "valid", value: {categoryId, text}};
    }
  };

  const handleSubmit = async () => {
    const result = validate();

    if (result.type === "valid") {
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
        {errors.length > 0 && (
          <div className="CardAddModal-Errors">
            <ul>
              {errors.map((error, errorIndex) => (
                <li key={errorIndex}>
                  {error.summaryText}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="CardAddModal-Body">
          <label className="CardAddModal-ControlLabel" htmlFor={textControlId}>
            Text
          </label>
          <div className="CardAddModal-Control">
            <Input
              autoFocus
              id={textControlId}
              onChange={text => setText(text)}
              value={text}
            />
          </div>
          <label className="CardAddModal-ControlLabel">
            Parent
          </label>
          <div className="CardAddModal-Control">
            {parent === null ? "None" : `${parent.text} (#${parent.number})`}
          </div>
          <label className="CardAddModal-ControlLabel">Category</label>
          <div className="CardAddModal-Control">
            <CategorySelect
              availableCategories={availableCategories}
              onChange={categoryId => setCategoryId(categoryId)}
              value={categoryId}
            />
            {errors.filter(error => error.elementId).map((error, errorIndex) => (
              <div key={errorIndex}>
                {error.inlineText}
              </div>
            ))}
          </div>
        </div>
      </ActionModal.Body>
      <ActionModal.Footer>
        <div className="CardAddModal-Buttons">
          <div>
            <Button type="button" intent="secondary" onClick={onClose}>Cancel</Button>
          </div>
          <div>
            <ActionModal.Status />
            <ActionModal.SubmitButton>Add Card</ActionModal.SubmitButton>
          </div>
        </div>
      </ActionModal.Footer>
    </ActionModal>
  );
}
