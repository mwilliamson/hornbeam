import classNames from "classnames";

import { Card } from "../../app/cards";
import { Category, categoryBackgroundColorStyle } from "../../app/categories";
import { ColorSet } from "../../app/colors";
import "./CardView.scss";
import CardStatusLabel from "../cardStatuses/CardStatusLabel";

interface CardViewProps {
  appSnapshot: ColorSet;
  card: Card;
  cardCategory: Category | null;
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
}

export default function CardView(props: CardViewProps) {
  const {appSnapshot, card, cardCategory, isSelected, onClick, onDoubleClick} = props;

  return (
    <div
      className={classNames("CardView", {"CardView--selected": isSelected})}
      style={categoryBackgroundColorStyle(cardCategory, appSnapshot)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="CardView-Text">
        {card.text}
      </div>
      <div className="CardView-Details">
        <div>
          {cardCategory === null ? null : cardCategory.name}
        </div>
        <div>
          {card.status === null ? null : (
            <CardStatusLabel value={card.status} />
          )}
        </div>
      </div>
    </div>
  );
}

export const cardHeight = 85;
