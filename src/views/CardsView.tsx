import classNames from "classnames";
import { Card } from "../app";
import "./CardsView.scss";

interface CardsViewProps {
  cards: ReadonlyArray<Card>;
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
}

export default function CardsView(props: CardsViewProps) {
  const {cards, cardSelectedId, onCardSelect} = props;

  return (
    <div className="CardsView">
      {cards.map(card => (
        <Card
          key={card.id}
          card={card}
          isSelected={cardSelectedId === card.id}
          onSelect={() => onCardSelect(card.id)}
        />
      ))}
    </div>
  );
}

interface CardProps {
  card: Card;
  isSelected: boolean;
  onSelect: () => void;
}

function Card(props: CardProps) {
  const {card, isSelected, onSelect} = props;

  return (
    <div
      className={classNames("CardsView-Card", {"CardsView-Card--selected": isSelected})}
      onClick={onSelect}
    >
      <div className="CardsView-Card-Content">
        {card.text}
      </div>
    </div>
  );
}
