import { useId, useState } from "react";

import ActionModal from "./widgets/ActionModal";
import Button from "./widgets/Button";
import Input from "./widgets/Input";
import "./CardAddModal.scss";
import { Card } from "../app";

interface CardAddModalProps {
  onCardAdd: (text: string) => Promise<void>;
  onClose: () => void;
  parent: Card | null;
}

export default function CardAddModal(props: CardAddModalProps) {
  const {onCardAdd, onClose, parent} = props;

  const [text, setText] = useState("");

  const labelElementId = useId();

  return (
    <ActionModal
      labelElementId={labelElementId}
      onClose={onClose}
      onSubmit={() => onCardAdd(text)}
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
        <div className="mt-md">
          Parent: {parent === null ? "None" : `${parent.text} (#${parent.number})`}
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
