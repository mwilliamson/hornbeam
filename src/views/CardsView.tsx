import classNames from "classnames";
import groupBy from "lodash/groupBy";
import React from "react";

import { Card, Category, CategorySet } from "../app";
import "./CardsView.scss";

interface CardsViewProps {
  allCategories: CategorySet;
  cards: ReadonlyArray<Card>;
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
  onCardEdit: (cardId: string | null) => void;
}

export default function CardsView(props: CardsViewProps) {
  const {allCategories, cards, cardSelectedId, onCardSelect, onCardEdit} = props;

  const cardsByParentId = groupBy(
    cards.filter(card => card.parentCardId !== null),
    card => card.parentCardId,
  );

  const cardTops = calculateCardTops(cards, cardsByParentId);

  return (
    <div className="CardsView">
      <div className="CardsView-Cards" onClick={() => onCardSelect(null)}>
        {cards.filter(card => card.parentCardId === null).map(card => (
          <CardTreeView
            key={card.id}
            allCategories={allCategories}
            card={card}
            cardsByParentId={cardsByParentId}
            cardTops={cardTops}
            cardSelectedId={cardSelectedId}
            onCardSelect={onCardSelect}
            onCardEdit={onCardEdit}
          />
        ))}
      </div>
    </div>
  );
}

interface CardTreeViewProps {
  allCategories: CategorySet;
  card: Card;
  cardsByParentId: {[id: string]: ReadonlyArray<Card>};
  cardTops: {[cardId: string]: number};
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
  onCardEdit: (cardId: string | null) => void;
}

function CardTreeView(props: CardTreeViewProps) {
  const {
    allCategories,
    card,
    cardsByParentId,
    cardTops,
    cardSelectedId,
    onCardSelect,
    onCardEdit,
  } = props;

  const children = cardsByParentId[card.id] || [];
  const lastChild = children.length === 0 ? null : children[children.length - 1];

  const parentChildGap = 100;
  const branchStroke = "#666";
  const branchY = (childCard: Card) => {
    const cardTop = cardTops[childCard.id] - cardTops[card.id];
    return Math.floor(cardTop + cardHeight / 2) + 0.5;
  };
  const branchesHeight = lastChild === null ? 0 : branchY(lastChild) + 1;

  return (
    <div className="CardsView-TreeView">
      <div className="CardsView-TreeView-Parent">
        <CardView
          card={card}
          cardCategory={allCategories.findCategoryById(card.categoryId)}
          isSelected={cardSelectedId === card.id}
          onSelect={() => onCardSelect(card.id)}
          onEdit={() => onCardEdit(card.id)}
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
              const y = branchY(childCard);

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
                      y1={branchY(children[0])}
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
                allCategories={allCategories}
                card={childCard}
                cardsByParentId={cardsByParentId}
                cardTops={cardTops}
                cardSelectedId={cardSelectedId}
                onCardSelect={onCardSelect}
                onCardEdit={onCardEdit}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function calculateCardTops(
  cards: ReadonlyArray<Card>,
  cardsByParentId: {[id: string]: ReadonlyArray<Card>}
): {[cardId: string]: number} {
  // TODO: if we're going to calculate positions here, should we just position
  // the cards absolutely? Probably.
  const siblingGap = 12;

  const cardTops: {[id: string]: number} = {};

  let y = 0;

  const handleCard = (card: Card) => {
    cardTops[card.id] = y;

    const childCards = cardsByParentId[card.id] ?? [];

    if (childCards.length === 0) {
      y += cardHeight + siblingGap;
    } else {
      for (const childCard of childCards) {
        handleCard(childCard);
      }
    }
  };

  for (const card of cards) {
    if (card.parentCardId === null) {
      handleCard(card);
    }
  }

  return cardTops;
}

interface CardViewProps {
  card: Card;
  cardCategory: Category | null;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

function CardView(props: CardViewProps) {
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
      className={classNames("CardsView-Card", {"CardsView-Card--selected": isSelected})}
      style={{backgroundColor}}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="CardsView-Card-Text">
        {card.text}
      </div>
      <div className="CardsView-Card-Details">
        <div className="CardsView-Card-Number">
          #{card.number}
        </div>
        <div className="CardsView-Card-Category">
          {cardCategory === null ? null : cardCategory.name}
        </div>
      </div>
    </div>
  );
}

const cardHeight = 85;
