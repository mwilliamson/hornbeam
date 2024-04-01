import { Card } from "../app";
import "./CardsView.scss";

interface CardsViewProps {
  cards: ReadonlyArray<Card>;
}

export default function CardsView(props: CardsViewProps) {
  const {cards} = props;

  return (
    <div className="CardsView">
      {cards.map(card => (
        <Card card={card} key={card.id} />
      ))}
    </div>
  );
}

interface CardProps {
  card: Card;
}

function Card(props: CardProps) {
  const {card} = props;

  return (
    <div className="CardsView-Card">
      <div className="CardsView-Card-Content">
        {card.text}
      </div>
    </div>
  );
}
