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
      <div style={{marginBottom: "1em"}}>
        <h2 id={labelElementId}>Add Card</h2>
      </div>
      <div style={{marginBottom: "1em"}}>
        <input
          autoFocus
          onChange={event => setText(event.target.value)}
          value={text}
          style={{fontSize: "1rem", padding: "0.2rem 0.5rem", width: "100%"}}
        />
      </div>
      <div>
        <div className="CardAddModal-Buttons">
          <div>
            <Button type="button" intent="secondary" onClick={onClose}>Cancel</Button>
          </div>
          <div>
            <ActionModal.Status />
            <ActionModal.SubmitButton>Add Card</ActionModal.SubmitButton>
          </div>
        </div>
      </div>
    </ActionModal>
  );
}
