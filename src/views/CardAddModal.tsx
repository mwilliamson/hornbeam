import { useId, useState } from "react";

import ActionModal from "./widgets/ActionModal";
import Button from "./widgets/Button";
import "./CardAddModal.scss";

interface CardAddModalProps {
  onCardAdd: (text: string) => Promise<void>;
  onClose: () => void;
}

export default function CardAddModal(props: CardAddModalProps) {
  const {onCardAdd, onClose} = props;

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
        <input
          autoFocus
          onChange={event => setText(event.target.value)}
          value={text}
          style={{fontSize: "1rem", padding: "0.2rem 0.5rem", width: "100%"}}
        />
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
