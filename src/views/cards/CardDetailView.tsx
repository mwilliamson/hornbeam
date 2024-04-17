import { Card, CardEvent, CategorySet, cardHistory } from "../../app";
import Button from "../widgets/Button";
import InstantView from "../widgets/InstantView";
import "./CardDetailView.scss";

interface CardDetailViewProps {
  allCategories: CategorySet;
  card: Card;
  onAddChildClick: () => void;
}

export default function CardDetailView(props: CardDetailViewProps) {
  const {allCategories, card, onAddChildClick} = props;

  const category = allCategories.findCategoryById(card.categoryId);

  const categoryColor = category === null ? undefined : category.color.hex;

  return (
    <>
      <div className="CardDetailView-Header p-md" style={{backgroundColor: categoryColor}}>
        <h2 className="CardDetailView-Title">
          {card.text} (#{card.number})
        </h2>
      </div>
      <div>
        <Button
          intent="primary"
          type="button"
          onClick={onAddChildClick}
        >
          Add Child
        </Button>
      </div>
      <div className="CardDetailView-History">
        <h3>History</h3>
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
