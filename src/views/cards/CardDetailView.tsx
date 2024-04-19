import { useId, useState } from "react";
import { Card, CardEvent, CardSet, cardHistory, validateCardText } from "../../app/cards";
import { CategorySet, categoryBackgroundColorStyle } from "../../app/categories";
import { ColorSet } from "../../app/colors";
import pluralize from "../../util/pluralize";
import { ValidationError, ValidationResult } from "../../util/validation";
import CategorySelect from "../categories/CategorySelect";
import { ValidationErrorsInlineView } from "../validation-views";
import Button from "../widgets/Button";
import ControlGroup from "../widgets/ControlGroup";
import ControlLabel from "../widgets/ControlLabel";
import Input from "../widgets/Input";
import InstantView from "../widgets/InstantView";
import LinkButton from "../widgets/LinkButton";
import "./CardDetailView.scss";
import CardParentView from "./CardParentView";
import CardView from "./CardView";

interface CardDetailViewProps {
  appState: CardSet & CategorySet & ColorSet;
  card: Card;
  onAddChildClick: () => void;
  onCardCategorySave: (newCategoryId: string) => Promise<void>;
  onCardTextSave: (newText: string) => Promise<void>;
}

export default function CardDetailView(props: CardDetailViewProps) {
  const {
    appState,
    card,
    onAddChildClick,
    onCardCategorySave,
    onCardTextSave,
  } = props;

  const category = appState.findCategoryById(card.categoryId);

  return (
    <>
      <div className="CardDetailView-Header">
        <div>
          <CardView
            appState={appState}
            card={card}
            cardCategory={category}
          />
        </div>
      </div>

      <div className="CardDetailView-Properties">
        <CardTextPropertyView card={card} onCardTextSave={onCardTextSave} />
        <CardParentPropertyView appState={appState} parentCardId={card.parentCardId} />
        <CardCategoryPropertyView
          appState={appState}
          categoryId={card.categoryId}
          onCardCategorySave={onCardCategorySave}
        />
        <CardChildrenView
          appState={appState}
          cardId={card.id}
          onAddChildClick={onAddChildClick}
        />
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
  appState: CardSet;
  parentCardId: string | null
}

function CardParentPropertyView(props: CardParentPropertyViewProps) {
  const {appState, parentCardId} = props;

  return (
    <>
      <ControlLabel>
        Parent
      </ControlLabel>
      <ControlGroup>
        <CardParentView appState={appState} parentCardId={parentCardId} />
      </ControlGroup>
    </>
  );
}

interface CardCategoryPropertyViewProps {
  appState: CategorySet & ColorSet;
  categoryId: string;
  onCardCategorySave: (newCategoryId: string) => Promise<void>;
}

function CardCategoryPropertyView(props: CardCategoryPropertyViewProps) {
  const {appState, categoryId, onCardCategorySave} = props;

  const category = appState.findCategoryById(categoryId);
  if (category === null) {
    // TODO: log error
    return null;
  }

  return (
    <EditableCardPropertyView
      initialEditValue={categoryId}
      label="Category"
      onSave={onCardCategorySave}
      renderControl={({id, onChange, value}) => (
        <CategorySelect
          appState={appState}
          availableCategories={appState.availableCategories()}
          id={id}
          onChange={onChange}
          value={value}
        />
      )}
      renderReadonly={({id}) => (
        <div className="CardDetailView-CategoryCardContainer" id={id}>
          <div
            className="CardDetailView-CategoryCard"
            style={categoryBackgroundColorStyle(category, appState)}
          >
            {category.name}
          </div>
        </div>
      )}
      validate={validateCardText}
    />
  );
}

interface CardChildrenViewProps {
  appState: CardSet;
  cardId: string;
  onAddChildClick: () => void;
}

function CardChildrenView(props: CardChildrenViewProps) {
  const {appState, cardId, onAddChildClick} = props;

  const childCount = appState.countCardChildren(cardId);

  return (
    <>
      <ControlLabel
        buttons={
          <LinkButton onClick={onAddChildClick}>
            Add child
          </LinkButton>
        }
      >
        Children
      </ControlLabel>
      <ControlGroup>
        {childCount} {pluralize(childCount, "child", "children")}
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

  const handleEditClick = () => {
    setEditState({value: initialEditValue, errors: []});
  };

  const handleCancelClick = () => {
    setEditState(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
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
    <form onSubmit={handleSubmit}>
      <ControlLabel
        buttons={
          editState === null ? (
            <LinkButton onClick={handleEditClick}>
              Edit
            </LinkButton>
          ) : (
            <>
              <Button type="button" intent="secondary" inline onClick={handleCancelClick}>
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
