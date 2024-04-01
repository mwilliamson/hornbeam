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
      <div className="CardsView-Cards" onClick={() => onCardSelect(null)}>
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            isSelected={cardSelectedId === card.id}
            onSelect={() => onCardSelect(card.id)}
          />
        ))}
      </div>
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

  const handleClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    onSelect();
  };

  return (
    <div
      className={classNames("CardsView-Card", {"CardsView-Card--selected": isSelected})}
      onClick={handleClick}
    >
      <div className="CardsView-Card-Content">
        {card.text}
      </div>
    </div>
  );
}
