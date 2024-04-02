import { useId, useState } from "react";

import Button from "./widgets/Button";
import Modal from "./widgets/Modal";
import "./CardAddModal.scss";

interface CardAddModalProps {
  onCardAdd: (text: string) => void;
  onClose: () => void;
}

export default function CardAddModal(props: CardAddModalProps) {
  const {onCardAdd, onClose} = props;

  const [text, setText] = useState("");

  const labelElementId = useId();

  const handleClose = (returnValue: string) => {
    if (returnValue === "submit") {
      onCardAdd(text);
    } else {
      onClose();
    }
  };

  return (
    <Modal labelElementId={labelElementId} onClose={handleClose}>
      <form method="dialog">
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
              <Button type="button" onClick={onClose}>Cancel</Button>
            </div>
            <div>
              <Button type="submit" value="submit">Add Card</Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
