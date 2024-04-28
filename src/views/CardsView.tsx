import React from "react";

import { CardTree, cardsToTrees } from "../app/cardTrees";
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

  const cardTrees = cardsToTrees(cards);

  const cardTops = calculateCardTops(cardTrees);

  return (
    <div className="CardsView">
      <div className="CardsView-Cards" onClick={() => onCardSelect(null)}>
        <CardList
          appSnapshot={appSnapshot}
          cardTrees={cardTrees}
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
  cardTree: CardTree;
  cardTops: {[cardId: string]: number};
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (cardId: string) => void;
}

function CardTreeView(props: CardTreeViewProps) {
  const {
    appSnapshot,
    cardTree,
    cardTops,
    cardSelectedId,
    onCardSelect,
    onCardAddChildClick,
  } = props;

  const {card} = cardTree;

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
      {cardTree.children.length > 0 && (
        <>
          <Branches
            cardTops={cardTops}
            childCardTrees={cardTree.children}
            parentCard={card}
          />
          <CardList
            appSnapshot={appSnapshot}
            cardTrees={cardTree.children}
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
  cardTrees: ReadonlyArray<CardTree>;
  cardTops: {[cardId: string]: number};
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (cardId: string) => void;
}

function CardList(props: CardListProps) {
  const {
    appSnapshot,
    cardTrees,
    cardTops,
    cardSelectedId,
    onCardSelect,
    onCardAddChildClick,
  } = props;

  return (
    <div className="CardsView-CardList">
      {cardTrees.map(cardTree => (
        <CardTreeView
          key={cardTree.card.id}
          appSnapshot={appSnapshot}
          cardTree={cardTree}
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
  childCardTrees: ReadonlyArray<CardTree>;
  parentCard: Card;
}

function Branches(props: BranchesProps) {
  const {cardTops, childCardTrees, parentCard} = props;

  const lastChild = childCardTrees.length === 0
    ? null
    : childCardTrees[childCardTrees.length - 1];

  const parentChildGap = 100;
  const branchStroke = "#666";
  const branchY = (childCard: Card) => {
    const cardTop = cardTops[childCard.id] - cardTops[parentCard.id];
    return Math.floor(cardTop + cardHeight / 2) + 0.5;
  };
  const branchesHeight = lastChild === null ? 0 : branchY(lastChild.card) + 1;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${parentChildGap} ${branchesHeight}`}
      width={parentChildGap}
      height={branchesHeight}
    >
      {childCardTrees.map((childCardTree, childCardIndex) => {
        const childCard = childCardTree.card;
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
        } else if (childCardIndex === childCardTrees.length - 1) {
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
                y1={branchY(childCardTrees[0].card)}
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
  cardTrees: ReadonlyArray<CardTree>,
): {[cardId: string]: number} {
  // TODO: if we're going to calculate positions here, should we just position
  // the cards absolutely? Probably.
  const siblingGap = 12;

  const cardTops: {[id: string]: number} = {};

  let y = 0;

  const handleCardTree = (cardTree: CardTree) => {
    cardTops[cardTree.card.id] = y;

    if (cardTree.children.length === 0) {
      y += cardHeight + siblingGap;
    } else {
      for (const childCardTree of cardTree.children) {
        handleCardTree(childCardTree);
      }
    }
  };

  for (const cardTree of cardTrees) {
    handleCardTree(cardTree);
  }

  return cardTops;
}
