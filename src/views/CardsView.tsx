import classNames from "classnames";
import groupBy from "lodash/groupBy";

import { Card } from "../app";
import "./CardsView.scss";

interface CardsViewProps {
  cards: ReadonlyArray<Card>;
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
}

export default function CardsView(props: CardsViewProps) {
  const {cards, cardSelectedId, onCardSelect} = props;

  const cardsByParentId = groupBy(
    cards.filter(card => card.parentCardId !== null),
    card => card.parentCardId,
  );

  return (
    <div className="CardsView">
      <div className="CardsView-Cards" onClick={() => onCardSelect(null)}>
        {cards.filter(card => card.parentCardId === null).map(card => (
          <CardTreeView
            key={card.id}
            card={card}
            cardsByParentId={cardsByParentId}
            cardSelectedId={cardSelectedId}
            onCardSelect={onCardSelect}
          />
        ))}
      </div>
    </div>
  );
}

interface CardTreeViewProps {
  card: Card;
  cardsByParentId: {[id: string]: ReadonlyArray<Card>};
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
}

function CardTreeView(props: CardTreeViewProps) {
  const {card, cardsByParentId, cardSelectedId, onCardSelect} = props;

  const children = cardsByParentId[card.id] || [];

  // TODO: extract card row?

  return (
    <div>
      <CardView
        card={card}
        isSelected={cardSelectedId === card.id}
        onSelect={() => onCardSelect(card.id)}
      />
      <div className="CardsView-Tree-Children">
        {children.map(childCard => (
          <CardTreeView
            key={childCard.id}
            card={childCard}
            cardsByParentId={cardsByParentId}
            cardSelectedId={cardSelectedId}
            onCardSelect={onCardSelect}
          />
        ))}
      </div>
    </div>
  );
}

interface CardViewProps {
  card: Card;
  isSelected: boolean;
  onSelect: () => void;
}

function CardView(props: CardViewProps) {
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
