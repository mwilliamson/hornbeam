import { useId, useState } from "react";
import { BoardId, cardSubboardId, isCardSubboardId, rootBoardId } from "hornbeam-common/lib/app/boards";
import { CardStatus } from "hornbeam-common/lib/app/cardStatuses";
import { Card, CardEditMutation, CardEvent, CardHistory, CardSearcher, validateCardText } from "hornbeam-common/lib/app/cards";
import { CategorySet, categoryBackgroundColorStyle } from "hornbeam-common/lib/app/categories";
import { ColorSet } from "hornbeam-common/lib/app/colors";
import { handleNever } from "hornbeam-common/lib/util/assertNever";
import pluralize from "hornbeam-common/lib/util/pluralize";
import { ValidationError, ValidationResult } from "hornbeam-common/lib/util/validation";
import CardStatusLabel from "../cardStatuses/CardStatusLabel";
import CardStatusSelect from "../cardStatuses/CardStatusSelect";
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
import CardSelect from "./CardSelect";
import CardView from "./CardView";

interface CardDetailViewProps {
  allCategories: CategorySet;
  allColors: ColorSet;
  card: Card;
  cardChildCount: number;
  cardHistory: CardHistory,
  cardSearcher: CardSearcher,
  onAddChildClick: () => void;
  onCardEdit: (mutation: Omit<CardEditMutation, "id" | "projectId">) => Promise<void>;
  onCardMove: (direction: "up" | "down") => Promise<void>;
  onCommentAdd: (text: string) => Promise<void>;
  onBoardOpen: (boardId: BoardId) => void;
  parentCard: Card | null;
  selectedBoardId: BoardId;
}

export default function CardDetailView(props: CardDetailViewProps) {
  const {
    allCategories,
    allColors,
    card,
    cardChildCount,
    cardHistory,
    cardSearcher,
    onAddChildClick,
    onCardEdit,
    onCardMove,
    onCommentAdd,
    onBoardOpen,
    parentCard,
    selectedBoardId,
  } = props;

  const category = allCategories.findCategoryById(card.categoryId);

  const addCommentControlId = useId();

  const handleCardTextSave = (text: string) =>
    onCardEdit({text});

  const handleCardParentSave = (parentCardId: string | null) =>
    onCardEdit({parentCardId});

  const handleCardCategorySave = (categoryId: string) =>
    onCardEdit({categoryId});

  const handleCardStatusSave = (status: CardStatus) =>
    onCardEdit({status});

  const handleCardIsSubboardRootSave = (isSubboardRoot: boolean) =>
    onCardEdit({isSubboardRoot});

  return (
    <>
      <div className="CardDetailView-Header">
        <div>
          <CardView
            allColors={allColors}
            card={card}
            cardCategory={category}
          />
        </div>
      </div>

      <div className="CardDetailView-Properties">
        <CardTextPropertyView card={card} onCardTextSave={handleCardTextSave} />
        <CardParentPropertyView
          cardSearcher={cardSearcher}
          onCardMove={onCardMove}
          parentCard={parentCard}
          onCardParentSave={handleCardParentSave}
        />
        <CardCategoryPropertyView
          allCategories={allCategories}
          allColors={allColors}
          categoryId={card.categoryId}
          onCardCategorySave={handleCardCategorySave}
        />
        <CardStatusPropertyView
          status={card.status}
          onCardStatusSave={handleCardStatusSave}
        />
        <CardChildrenView
          childCount={cardChildCount}
          onAddChildClick={onAddChildClick}
        />
        <CardSubboardView
          card={card}
          onCardIsSubboardRootSave={handleCardIsSubboardRootSave}
          onBoardOpen={onBoardOpen}
          selectedBoardId={selectedBoardId}
        />
      </div>

      <div className="CardDetailView-History">
        <h3 className="CardDetailView-History-Title">History</h3>
        <div>
          {cardHistory.map((event, eventIndex) => (
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
  cardSearcher: CardSearcher;
  onCardMove: (direction: "up" | "down") => Promise<void>;
  parentCard: Card | null
  onCardParentSave: (newParentCardId: string | null) => Promise<void>;
}

function CardParentPropertyView(props: CardParentPropertyViewProps) {
  const {cardSearcher, onCardMove, parentCard, onCardParentSave} = props;

  return (
    <EditableCardPropertyView
      extraControls={
        <>
          <LinkButton onClick={() => onCardMove("up")}>
            ↑
          </LinkButton>
          {" "}
          <LinkButton onClick={() => onCardMove("down")}>
            ↓
          </LinkButton>
          {" "}
        </>
      }
      initialEditValue={parentCard}
      label="Parent"
      onSave={onCardParentSave}
      renderControl={({id, onChange, value}) => (
        <CardSelect
          cardSearcher={cardSearcher}
          id={id}
          onChange={onChange}
          value={value}
        />
      )}
      renderReadonly={({id}) => (
        <CardParentView
          id={id}
          parentCard={parentCard}
        />
      )}
      validate={(controlId, value) => ValidationResult.valid(value === null ? null : value.id)}
    />
  );
}

interface CardCategoryPropertyViewProps {
  allCategories: CategorySet;
  allColors: ColorSet;
  categoryId: string;
  onCardCategorySave: (newCategoryId: string) => Promise<void>;
}

function CardCategoryPropertyView(props: CardCategoryPropertyViewProps) {
  const {allCategories, allColors, categoryId, onCardCategorySave} = props;

  const category = allCategories.findCategoryById(categoryId);
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
          allColors={allColors}
          availableCategories={allCategories.availableCategories()}
          id={id}
          onChange={onChange}
          value={value}
        />
      )}
      renderReadonly={({id}) => (
        <div className="CardDetailView-CategoryCardContainer" id={id}>
          <div
            className="CardDetailView-CategoryCard"
            style={categoryBackgroundColorStyle(category, allColors)}
          >
            {category.name}
          </div>
        </div>
      )}
      validate={validateCardText}
    />
  );
}

interface CardStatusPropertyViewProps {
  status: CardStatus;
  onCardStatusSave: (newStatus: CardStatus) => Promise<void>;
}

function CardStatusPropertyView(props: CardStatusPropertyViewProps) {
  const {status, onCardStatusSave} = props;

  return (
    <EditableCardPropertyView
      initialEditValue={status}
      label="Status"
      onSave={onCardStatusSave}
      renderControl={({id, onChange, value}) => (
        <CardStatusSelect
          id={id}
          onChange={onChange}
          value={value}
        />
      )}
      renderReadonly={({id}) => (
        <span id={id}>
          <CardStatusLabel showNone value={status} />
        </span>
      )}
      validate={(controlId, newStatus) => ValidationResult.valid(newStatus)}
    />
  );
}

interface CardChildrenViewProps {
  childCount: number;
  onAddChildClick: () => void;
}

function CardChildrenView(props: CardChildrenViewProps) {
  const {childCount, onAddChildClick} = props;

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

interface CardIsSubboardRootViewProps {
  card: Card;
  onCardIsSubboardRootSave: (isSubboardRoot: boolean) => Promise<void>;
  onBoardOpen: (boardId: BoardId) => void;
  selectedBoardId: BoardId;
}

function CardSubboardView(props: CardIsSubboardRootViewProps) {
  const {card, onCardIsSubboardRootSave, onBoardOpen, selectedBoardId} = props;

  const handleEnableSubboard = () =>
    onCardIsSubboardRootSave(true);

  const handleDisableSubboard = () =>
    onCardIsSubboardRootSave(false);

  const [toggleText, handleToggle] = card.isSubboardRoot
    ? ["Disable subboard", handleDisableSubboard]
    : ["Enable subboard", handleEnableSubboard];

  return (
    <>
      <ControlLabel>
        Subboard
      </ControlLabel>
      <ControlGroup>
        <Button
          type="button"
          fullWidth
          intent="secondary"
          onClick={handleToggle}
        >
          {toggleText}
        </Button>
      </ControlGroup>

      {card.isSubboardRoot && (
        // TODO: closing the subboard should bring you to the parent. Or perhaps
        // we just remove thus altogether and leave opening the subboard to the
        // rest of the UI?
        <ControlGroup>
          {isCardSubboardId(selectedBoardId, card.id) ? (
            <Button
              type="button"
              fullWidth
              intent="secondary"
              onClick={() => onBoardOpen(rootBoardId)}
            >
              Close subboard
            </Button>
          ) : (
            <Button
              type="button"
              fullWidth
              intent="secondary"
              onClick={() => onBoardOpen(cardSubboardId(card.id))}
            >
              Open subboard
            </Button>
          )}
        </ControlGroup>
      )}
    </>
  );
}

interface EditableCardPropertyViewProps<TEdit, TValid> {
  extraControls?: React.ReactNode;
  initialEditValue: TEdit;
  label: React.ReactNode;
  onSave: (value: TValid) => Promise<void>;
  renderControl: (args: {id: string, onChange: (value: TEdit) => void, value: TEdit}) => React.ReactNode;
  renderReadonly: (args: {id: string}) => React.ReactNode;
  validate: (controlId: string, value: TEdit) => ValidationResult<TValid>;
}

function EditableCardPropertyView<TEdit, TValid>(props: EditableCardPropertyViewProps<TEdit, TValid>) {
  const {extraControls, initialEditValue, label, onSave, renderControl, renderReadonly, validate} = props;

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
            <>
              {extraControls}
              <LinkButton onClick={handleEditClick}>
                Edit
              </LinkButton>
            </>
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
      return handleNever(cardEvent, null);
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
      return handleNever(cardEvent, null);
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
    setText("");
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
