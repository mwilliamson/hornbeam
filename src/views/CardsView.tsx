import groupBy from "lodash/groupBy";
import React from "react";

import { Card } from "../app/cards";
import { CategorySet } from "../app/categories";
import { ColorSet } from "../app/colors";
import "./CardsView.scss";
import CardView, { cardHeight } from "./cards/CardView";

interface CardsViewProps {
  appSnapshot: CategorySet & ColorSet;
  cards: ReadonlyArray<Card>;
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (cardId: string) => void;
}

export default function CardsView(props: CardsViewProps) {
  const {
    appSnapshot,
    cards,
    cardSelectedId,
    onCardSelect,
    onCardAddChildClick,
  } = props;

  const cardsByParentId = groupBy(
    cards.filter(card => card.parentCardId !== null),
    card => card.parentCardId,
  );

  const cardTops = calculateCardTops(cards, cardsByParentId);

  return (
    <div className="CardsView">
      <div className="CardsView-Cards" onClick={() => onCardSelect(null)}>
        <CardList
          appSnapshot={appSnapshot}
          cards={cards.filter(card => card.parentCardId === null)}
          cardsByParentId={cardsByParentId}
          cardTops={cardTops}
          cardSelectedId={cardSelectedId}
          onCardSelect={onCardSelect}
          onCardAddChildClick={onCardAddChildClick}
        />
      </div>
    </div>
  );
}

interface CardTreeViewProps {
  appSnapshot: CategorySet & ColorSet;
  card: Card;
  cardsByParentId: {[id: string]: ReadonlyArray<Card>};
  cardTops: {[cardId: string]: number};
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (cardId: string) => void;
}

function CardTreeView(props: CardTreeViewProps) {
  const {
    appSnapshot,
    card,
    cardsByParentId,
    cardTops,
    cardSelectedId,
    onCardSelect,
    onCardAddChildClick,
  } = props;

  const children = cardsByParentId[card.id] || [];

  const handleCardClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onCardSelect(card.id);
  };

  const handleAddChildClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onCardAddChildClick(card.id);
  };

  const isSelected = cardSelectedId === card.id;

  return (
    <div className="CardsView-TreeView">
      <div className="CardsView-TreeView-Parent">
        <CardView
          appSnapshot={appSnapshot}
          card={card}
          cardCategory={appSnapshot.findCategoryById(card.categoryId)}
          isSelected={isSelected}
          onClick={handleCardClick}
        />
        {isSelected && (
          <div className="CardsView-AddChildContainer">
            <button
              type="button"
              aria-label="Add child"
              className="CardsView-AddChild"
              onClick={handleAddChildClick}
            >
              +
            </button>
          </div>
        )}
      </div>
      {children.length > 0 && (
        <>
          <Branches
            cardTops={cardTops}
            childCards={children}
            parentCard={card}
          />
          <CardList
            appSnapshot={appSnapshot}
            cards={children}
            cardsByParentId={cardsByParentId}
            cardTops={cardTops}
            cardSelectedId={cardSelectedId}
            onCardSelect={onCardSelect}
            onCardAddChildClick={onCardAddChildClick}
          />
        </>
      )}
    </div>
  );
}

interface CardListProps {
  appSnapshot: CategorySet & ColorSet;
  cards: ReadonlyArray<Card>;
  cardsByParentId: {[id: string]: ReadonlyArray<Card>};
  cardTops: {[cardId: string]: number};
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (cardId: string) => void;
}

function CardList(props: CardListProps) {
  const {
    appSnapshot,
    cards,
    cardsByParentId,
    cardTops,
    cardSelectedId,
    onCardSelect,
    onCardAddChildClick,
  } = props;

  return (
    <div className="CardsView-CardList">
      {cards.map(card => (
        <CardTreeView
          key={card.id}
          appSnapshot={appSnapshot}
          card={card}
          cardsByParentId={cardsByParentId}
          cardTops={cardTops}
          cardSelectedId={cardSelectedId}
          onCardSelect={onCardSelect}
          onCardAddChildClick={onCardAddChildClick}
        />
      ))}
    </div>
  );
}

interface BranchesProps {
  cardTops: {[cardId: string]: number};
  childCards: ReadonlyArray<Card>;
  parentCard: Card;
}

function Branches(props: BranchesProps) {
  const {cardTops, childCards, parentCard} = props;

  const lastChild = childCards.length === 0
    ? null
    : childCards[childCards.length - 1];

  const parentChildGap = 100;
  const branchStroke = "#666";
  const branchY = (childCard: Card) => {
    const cardTop = cardTops[childCard.id] - cardTops[parentCard.id];
    return Math.floor(cardTop + cardHeight / 2) + 0.5;
  };
  const branchesHeight = lastChild === null ? 0 : branchY(lastChild) + 1;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${parentChildGap} ${branchesHeight}`}
      width={parentChildGap}
      height={branchesHeight}
    >
      {childCards.map((childCard, childCardIndex) => {
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
        } else if (childCardIndex === childCards.length - 1) {
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
                y1={branchY(childCards[0])}
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
