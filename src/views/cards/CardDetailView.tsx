import { useId, useState } from "react";
import { Card, CardEvent, CardSet, CategorySet, cardHistory, validateCardText } from "../../app";
import { ValidationError } from "../../util/validation";
import Button from "../widgets/Button";
import ControlGroup from "../widgets/ControlGroup";
import ControlLabel from "../widgets/ControlLabel";
import Input from "../widgets/Input";
import InstantView from "../widgets/InstantView";
import "./CardDetailView.scss";
import CardView from "./CardView";
import { ValidationErrorsInlineView } from "../validation-views";
import CardParentView from "./CardParentView";

interface CardDetailViewProps {
  allCards: CardSet;
  allCategories: CategorySet;
  card: Card;
  onAddChildClick: () => void;
  onCardTextSave: (newText: string) => Promise<void>;
}

export default function CardDetailView(props: CardDetailViewProps) {
  const {allCards, allCategories, card, onAddChildClick, onCardTextSave} = props;

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
        <CardTextPropertyView card={card} onCardTextSave={onCardTextSave} />
        <CardParentPropertyView allCards={allCards} parentCardId={card.parentCardId} />
        <CardCategoryPropertyView allCategories={allCategories} categoryId={card.categoryId} />
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

interface CardTextPropertyViewProps {
  card: Card;
  onCardTextSave: (newText: string) => Promise<void>;
}

function CardTextPropertyView(props: CardTextPropertyViewProps) {
  const {card, onCardTextSave} = props;

  const textEditControlId = useId();
  const [textEdit, setTextEdit] = useState<{text: string, errors: ReadonlyArray<ValidationError>} | null>(null);

  const handleTextSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (textEdit !== null) {
      const validationResult = validateCardText(textEditControlId, textEdit.text);

      if (validationResult.isValid) {
        await onCardTextSave(textEdit.text);
        setTextEdit(null);
      } else {
        setTextEdit({...textEdit, errors: validationResult.errors});
      }
    }
  };

  return (
    <form onSubmit={handleTextSave}>
      <ControlLabel
        buttons={
          textEdit === null ? (
            /* TODO: proper link button */
            <a
              href="#"
              onClick={(event) => {event.preventDefault(); setTextEdit({text: card.text, errors: []});}}
              style={{fontSize: 14, color: "#3182ce", textDecoration: "none"}}
            >
              Edit
            </a>
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
          <>
            <Input
              autoFocus
              id={textEditControlId}
              onChange={(newText) => setTextEdit(({...textEdit, text: newText}))}
              value={textEdit.text}
            />
            <ValidationErrorsInlineView
              elementId={textEditControlId}
              errors={textEdit.errors}
            />
          </>
        )}
      </ControlGroup>
    </form>
  );
}

interface CardParentPropertyViewProps {
  allCards: CardSet;
  parentCardId: string | null
}

function CardParentPropertyView(props: CardParentPropertyViewProps) {
  const {allCards, parentCardId} = props;

  return (
    <>
      <ControlLabel>
        Parent
      </ControlLabel>
      <ControlGroup>
        <CardParentView allCards={allCards} parentCardId={parentCardId} />
      </ControlGroup>
    </>

  );
}

interface CardCategoryPropertyViewProps {
  allCategories: CategorySet;
  categoryId: string;
}

function CardCategoryPropertyView(props: CardCategoryPropertyViewProps) {
  const {allCategories, categoryId} = props;

  const category = allCategories.findCategoryById(categoryId);

  return (
    <>
      <ControlLabel>
        Category
      </ControlLabel>
      <ControlGroup>
        {category?.name}
      </ControlGroup>
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
