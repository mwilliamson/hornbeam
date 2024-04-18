import { Card, CardEvent, CategorySet, cardHistory } from "../../app";
import Button from "../widgets/Button";
import InstantView from "../widgets/InstantView";
import "./CardDetailView.scss";
import CardView from "./CardView";

interface CardDetailViewProps {
  allCategories: CategorySet;
  card: Card;
  onAddChildClick: () => void;
}

export default function CardDetailView(props: CardDetailViewProps) {
  const {allCategories, card, onAddChildClick} = props;

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
