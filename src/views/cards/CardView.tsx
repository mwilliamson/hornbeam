import classNames from "classnames";

import { Card } from "../../app/cards";
import { Category, categoryBackgroundColorStyle } from "../../app/categories";
import { ColorSet } from "../../app/colors";
import "./CardView.scss";

interface CardViewProps {
  appState: ColorSet;
  card: Card;
  cardCategory: Category | null;
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
}

export default function CardView(props: CardViewProps) {
  const {appState, card, cardCategory, isSelected, onClick, onDoubleClick} = props;

  return (
    <div
      className={classNames("CardView", {"CardView--selected": isSelected})}
      style={categoryBackgroundColorStyle(cardCategory, appState)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
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
