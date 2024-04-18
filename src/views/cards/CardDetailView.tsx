import { useId, useState } from "react";
import { Card, CardEvent, CardSet, CategorySet, cardHistory, validateCardText } from "../../app";
import { ValidationError, ValidationResult } from "../../util/validation";
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

  return (
    <EditableCardPropertyView
      initialEditValue={card.text}
      label="Text"
      onSave={onCardTextSave}
      renderControl={({id, onChange, value}) => (
        <Input
          autoFocus
          id={id}
          onChange={onChange}
          value={value}
        />
      )}
      renderReadonly={({id}) => (
        <span id={id}>{card.text}</span>
      )}
      validate={validateCardText}
    />
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
  if (category === null) {
    // TODO: log error
    return null;
  }

  return (
    <>
      <ControlLabel>
        Category
      </ControlLabel>
      <ControlGroup>
        <div className="CardDetailView-CategoryCardContainer">
          <div
            className="CardDetailView-CategoryCard"
            style={{backgroundColor: category.color.hex}}
          >
            {category.name}
          </div>
        </div>
      </ControlGroup>
    </>

  );
}

interface EditableCardPropertyViewProps<TEdit, TValid> {
  initialEditValue: TEdit;
  label: React.ReactNode;
  onSave: (value: TValid) => Promise<void>;
  renderControl: (args: {id: string, onChange: (value: TEdit) => void, value: TEdit}) => React.ReactNode;
  renderReadonly: (args: {id: string}) => React.ReactNode;
  validate: (controlId: string, value: TEdit) => ValidationResult<TValid>;
}

function EditableCardPropertyView<TEdit, TValid>(props: EditableCardPropertyViewProps<TEdit, TValid>) {
  const {initialEditValue, label, onSave, renderControl, renderReadonly, validate} = props;

  const controlId = useId();
  const [editState, setEditState] = useState<{value: TEdit, errors: ReadonlyArray<ValidationError>} | null>(null);

  const handleTextSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (editState !== null) {
      const validationResult = validate(controlId, editState.value);

      if (validationResult.isValid) {
        await onSave(validationResult.value);
        setEditState(null);
      } else {
        setEditState({...editState, errors: validationResult.errors});
      }
    }
  };

  return (
    <form onSubmit={handleTextSave}>
      <ControlLabel
        buttons={
          editState === null ? (
            /* TODO: proper link button */
            <a
              href="#"
              onClick={(event) => {event.preventDefault(); setEditState({value: initialEditValue, errors: []});}}
              style={{fontSize: 14, color: "#3182ce", textDecoration: "none"}}
            >
              Edit
            </a>
          ) : (
            <>
              <Button type="button" intent="secondary" inline onClick={() => setEditState(null)}>
                Cancel
              </Button>
              <Button type="submit" intent="primary" inline>
                Save
              </Button>
            </>
          )
        }
      >
        {label}
      </ControlLabel>
      <ControlGroup>
        {editState === null ? (
          <span id={controlId}>{renderReadonly({id: controlId})}</span>
        ) : (
          <>
            {renderControl({
              id: controlId,
              onChange: newValue => setEditState({...editState, value: newValue}),
              value: editState.value
            })}

            <ValidationErrorsInlineView
              elementId={controlId}
              errors={editState.errors}
            />
          </>
        )}
      </ControlGroup>
    </form>
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
