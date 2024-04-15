import { useId, useState } from "react";

import { Card, Category } from "../app";
import ActionModal from "./widgets/ActionModal";
import Button from "./widgets/Button";
import Input from "./widgets/Input";
import "./CardAddModal.scss";
import CategorySelect from "./controls/CategorySelect";

interface CardAddModalProps {
  availableCategories: ReadonlyArray<Category>;
  onCardAdd: (categoryId: string, text: string) => Promise<void>;
  onClose: () => void;
  parent: Card | null;
}

export default function CardAddModal(props: CardAddModalProps) {
  const {availableCategories, onCardAdd, onClose, parent} = props;

  const [categoryId, setCategoryId] = useState<string>("");
  const [text, setText] = useState("");

  const labelElementId = useId();

  const handleSubmit = async () => {
    if (categoryId) {
      await onCardAdd(categoryId, text);
    }
  };

  return (
    <ActionModal
      labelElementId={labelElementId}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <ActionModal.Header>
        <h2 id={labelElementId}>Add Card</h2>
      </ActionModal.Header>
      <ActionModal.Body>
        <div className="mb-md">
          <Input
            autoFocus
            onChange={text => setText(text)}
            value={text}
          />
        </div>
        <div className="my-md">
          Parent: {parent === null ? "None" : `${parent.text} (#${parent.number})`}
        </div>
        <div className="mt-md">
          <fieldset>
            <legend>Category</legend>
            {" "}
            <CategorySelect
              availableCategories={availableCategories}
              onChange={categoryId => setCategoryId(categoryId)}
              value={categoryId}
            />
          </fieldset>
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
