import { useId, useState } from "react";
import { Card, CardEvent, CategorySet, cardHistory } from "../../app";
import Button from "../widgets/Button";
import ControlGroup from "../widgets/ControlGroup";
import ControlLabel from "../widgets/ControlLabel";
import InstantView from "../widgets/InstantView";
import "./CardDetailView.scss";
import CardView from "./CardView";
import Input from "../widgets/Input";

interface CardDetailViewProps {
  allCategories: CategorySet;
  card: Card;
  onAddChildClick: () => void;
  onCardTextSave: (newText: string) => Promise<void>;
}

export default function CardDetailView(props: CardDetailViewProps) {
  const {allCategories, card, onAddChildClick, onCardTextSave} = props;

  const textEditControlId = useId();
  const [textEdit, setTextEdit] = useState<string | null>(null);

  const handleTextSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (textEdit !== null) {
      await onCardTextSave(textEdit);
      setTextEdit(null);
    }
  };

  const category = allCategories.findCategoryById(card.categoryId);

  return (
    <>
      <div className="CardDetailView-Header">
        <CardView
          card={card}
          cardCategory={category}
        />
      </div>

      <div className="CardDetailView-Actions">
        <Button
          intent="primary"
          type="button"
          onClick={onAddChildClick}
        >
          Add Child
        </Button>
      </div>

      <div className="CardDetailView-Properties">
        <form onSubmit={handleTextSave}>
          <ControlLabel
            buttons={
              textEdit === null ? (
                <Button type="button" intent="secondary" inline onClick={() => setTextEdit(card.text)}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button type="button" intent="secondary" inline onClick={() => setTextEdit(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" intent="primary" inline>
                    Save
                  </Button>
                </>
              )
            }
          >
            Text
          </ControlLabel>
          <ControlGroup>
            {textEdit === null ? (
              <span id={textEditControlId}>{card.text}</span>
            ) : (
              <Input
                autoFocus
                id={textEditControlId}
                onChange={(newText) => setTextEdit(newText)}
                value={textEdit}
              />
            )}
          </ControlGroup>
        </form>
      </div>

      <div className="CardDetailView-History">
        <h3 className="CardDetailView-History-Title">History</h3>
        <div>
          {cardHistory(card).map((event, eventIndex) => (
            <div key={eventIndex} className="CardDetailView-Event">
              <div className="CardDetailView-Event-Instant">
                <InstantView value={event.instant} />
              </div>
              <div className="CardDetailView-Event-Description">
                <CardEventDescription cardEvent={event} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

interface CardEventDescriptionProps {
  cardEvent: CardEvent;
}

function CardEventDescription(props: CardEventDescriptionProps) {
  const {cardEvent} = props;

  switch (cardEvent.type) {
    case "created":
      return "Card created";
  }
}
