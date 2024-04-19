import { useId, useState } from "react";
import { Card, CardEvent, CardSet, cardHistory, validateCardText } from "../../app/cards";
import { CategorySet, categoryBackgroundColorStyle } from "../../app/categories";
import { ColorSet } from "../../app/colors";
import { CommentSet } from "../../app/comments";
import assertNever from "../../util/assertNever";
import pluralize from "../../util/pluralize";
import { ValidationError, ValidationResult } from "../../util/validation";
import CategorySelect from "../categories/CategorySelect";
import { ValidationErrorsInlineView } from "../validation-views";
import Button from "../widgets/Button";
import ControlGroup from "../widgets/ControlGroup";
import ControlLabel from "../widgets/ControlLabel";
import Form from "../widgets/Form";
import Input from "../widgets/Input";
import InstantView from "../widgets/InstantView";
import LinkButton from "../widgets/LinkButton";
import PlainTextView from "../widgets/PlainTextView";
import Textarea from "../widgets/Textarea";
import "./CardDetailView.scss";
import CardParentView from "./CardParentView";
import CardView from "./CardView";

interface CardDetailViewProps {
  appState: CardSet & CategorySet & ColorSet & CommentSet;
  card: Card;
  onAddChildClick: () => void;
  onCardCategorySave: (newCategoryId: string) => Promise<void>;
  onCardTextSave: (newText: string) => Promise<void>;
  onCommentAdd: (text: string) => Promise<void>;
}

export default function CardDetailView(props: CardDetailViewProps) {
  const {
    appState,
    card,
    onAddChildClick,
    onCardCategorySave,
    onCardTextSave,
    onCommentAdd,
  } = props;

  const category = appState.findCategoryById(card.categoryId);

  const addCommentControlId = useId();

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
          {cardHistory(card, appState).map((event, eventIndex) => (
            <CardEventView key={eventIndex} cardEvent={event} />
          ))}
        </div>
      </div>

      <div className="CardDetailView-AddComment">
        <h3><label htmlFor={addCommentControlId}>Add comment</label></h3>
        <CommentAddForm
          controlId={addCommentControlId}
          onCommentAdd={onCommentAdd}
        />
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

interface CardEventViewProps {
  cardEvent: CardEvent;
}

function CardEventView(props: CardEventViewProps) {
  const {cardEvent} = props;

  return (
    <div className="CardDetailView-Event">
      <div className="CardDetailView-Event-Header">
        <div className="CardDetailView-Event-Type">
          <CardEventTypeView cardEvent={cardEvent} />
        </div>
        <div className="CardDetailView-Event-Instant">
          <InstantView value={cardEvent.instant} />
        </div>
      </div>
      <div className="CardDetailView-Event-Description">
        <CardEventDescription cardEvent={cardEvent} />
      </div>
    </div>
  );
}

interface CardEventTypeViewProps {
  cardEvent: CardEvent;
}

function CardEventTypeView(props: CardEventTypeViewProps) {
  const {cardEvent} = props;

  switch (cardEvent.type) {
    case "created":
      return "Card created";
    case "comment":
      return "Comment";
    default:
      return assertNever(cardEvent, null);
  }
}

interface CardEventDescriptionProps {
  cardEvent: CardEvent;
}

function CardEventDescription(props: CardEventDescriptionProps) {
  const {cardEvent} = props;

  switch (cardEvent.type) {
    case "created":
      return null;
    case "comment":
      return (
        <PlainTextView value={cardEvent.comment.text} />
      );
    default:
      return assertNever(cardEvent, null);
  }
}

interface CommentAddFormProps {
  controlId: string;
  onCommentAdd: (text: string) => Promise<void>;
}

function CommentAddForm(props: CommentAddFormProps) {
  const {controlId, onCommentAdd} = props;

  const [text, setText] = useState("");

  const handleSubmit = async () => {
    await onCommentAdd(text);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <ControlGroup>
        <Textarea
          id={controlId}
          onChange={commentText => setText(commentText)}
          value={text}
        />
      </ControlGroup>
      <Form.MainButtons submitText="Add comment" />
    </Form>
  );
}
