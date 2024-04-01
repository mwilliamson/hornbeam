import classNames from "classnames";
import groupBy from "lodash/groupBy";
import React from "react";

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

  const cardHeight = 62;
  const parentChildGap = 100;
  const siblingGap = 12;
  const branchStroke = "#666";
  // TODO: account for grandchildren
  const branchesHeight = cardHeight * children.length + (siblingGap * (children.length - 1));
  const branchY = (childCardIndex: number) => {
    const cardTop = (cardHeight + siblingGap) * childCardIndex;
    return Math.floor(cardTop + cardHeight / 2) + 0.5;
  };

  return (
    <div className="CardsView-TreeView">
      <div className="CardsView-TreeView-Parent">
        <CardView
          card={card}
          isSelected={cardSelectedId === card.id}
          onSelect={() => onCardSelect(card.id)}
        />
      </div>
      {children.length > 0 && (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${parentChildGap} ${branchesHeight}`}
            width={parentChildGap}
            height={branchesHeight}
          >
            {children.map((childCard, childCardIndex) => {
              const y = branchY(childCardIndex);

              if (childCardIndex === 0) {
                return (
                  <line
                    key={childCard.id}
                    x1={0}
                    y1={y}
                    x2={parentChildGap}
                    y2={y}
                    stroke={branchStroke}
                  />
                );
              } else if (childCardIndex === children.length - 1) {
                return (
                  <React.Fragment key={childCard.id}>
                    <line
                      x1={parentChildGap / 2}
                      y1={y}
                      x2={parentChildGap}
                      y2={y}
                      stroke={branchStroke}
                    />
                    <line
                      x1={parentChildGap / 2}
                      y1={branchY(0)}
                      x2={parentChildGap / 2}
                      y2={y}
                      stroke={branchStroke}
                    />
                  </React.Fragment>
                );
              } else {
                return (
                  <line
                    key={childCard.id}
                    x1={parentChildGap / 2}
                    y1={y}
                    x2={parentChildGap}
                    y2={y}
                    stroke={branchStroke}
                  />
                );
              }
            })}
          </svg>
          <div className="CardsView-TreeView-Children">
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
        </>
      )}
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
