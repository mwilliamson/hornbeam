import classNames from "classnames";

import { Card, Category } from "../../app";
import "./CardView.scss";

interface CardViewProps {
  card: Card;
  cardCategory: Category | null;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

export default function CardView(props: CardViewProps) {
  const {card, cardCategory, isSelected, onSelect, onEdit} = props;

  const handleClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    onSelect();
  };

  const handleDoubleClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    onEdit();
  };

  const backgroundColor = cardCategory === null ? undefined : cardCategory.color.hex;

  return (
    <div
      className={classNames("CardView", {"CardView--selected": isSelected})}
      style={{backgroundColor}}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="CardView-Text">
        {card.text}
      </div>
      <div className="CardView-Details">
        <div className="CardView-Number">
          #{card.number}
        </div>
        <div className="CardView-Category">
          {cardCategory === null ? null : cardCategory.name}
        </div>
      </div>
    </div>
  );
}

export const cardHeight = 85;
