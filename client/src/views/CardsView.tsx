import { DndContext, DragEndEvent, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { ArrowRightIcon, PlusIcon } from "lucide-react";
import React from "react";

import { BoardId, cardSubboardId } from "hornbeam-common/lib/app/boards";
import { CardTree } from "hornbeam-common/lib/app/cardTrees";
import { Card, CardMoveToAfterRequest, CardMoveToBeforeRequest } from "hornbeam-common/lib/app/cards";
import { CategorySet } from "hornbeam-common/lib/app/categories";
import { ColorSet } from "hornbeam-common/lib/app/colors";
import assertNever from "hornbeam-common/lib/util/assertNever";
import "./CardsView.scss";
import CardView, { cardHeight } from "./cards/CardView";
import classNames from "classnames";

interface CardsViewProps {
  allCategories: CategorySet;
  allColors: ColorSet;
  cardTrees: ReadonlyArray<CardTree>;
  cardSelectedId: string | null;
  onCardMoveToAfter: (request: Omit<CardMoveToAfterRequest, "createdAt">) => void;
  onCardMoveToBefore: (request: Omit<CardMoveToBeforeRequest, "createdAt">) => void;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (card: Card) => void;
  onBoardOpen: (boardId: BoardId) => void;
}

export default function CardsView(props: CardsViewProps) {
  const {
    allCategories,
    allColors,
    cardTrees,
    cardSelectedId,
    onCardMoveToAfter,
    onCardMoveToBefore,
    onCardSelect,
    onCardAddChildClick,
    onBoardOpen,
  } = props;

  const cardTops = calculateCardTops(cardTrees);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 1000,
      }
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over === null) {
      return;
    }

    const droppable = event.over.data.current as DroppableData;
    const movedCardId = event.active.id as string;

    if (droppable.cardId === movedCardId) {
      return;
    }

    switch (droppable.type) {
      case "after":
        onCardMoveToAfter({
          afterCardId: droppable.cardId,
          moveCardId: movedCardId,
          parentCardId: droppable.parentCardId,
        });
        return;

      case "before":
        onCardMoveToBefore({
          beforeCardId: droppable.cardId,
          moveCardId: movedCardId,
          parentCardId: droppable.parentCardId,
        });
        return;

      default:
        assertNever(droppable.type, null);
        return;
    }
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="CardsView">
        <div className="CardsView-Cards" onClick={() => onCardSelect(null)}>
          <CardList
            allCategories={allCategories}
            allColors={allColors}
            cardTrees={cardTrees}
            cardTops={cardTops}
            cardSelectedId={cardSelectedId}
            isRoot
            onCardSelect={onCardSelect}
            onCardAddChildClick={onCardAddChildClick}
            onBoardOpen={onBoardOpen}
          />
        </div>
      </div>
    </DndContext>
  );
}

interface CardTreeViewProps {
  allCategories: CategorySet;
  allColors: ColorSet;
  cardTree: CardTree;
  cardTops: {[cardId: string]: number};
  cardSelectedId: string | null;
  isRoot: boolean;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (card: Card) => void;
  onBoardOpen: (boardId: BoardId) => void;
}

function CardTreeView(props: CardTreeViewProps) {
  const {
    allCategories,
    allColors,
    cardTree,
    cardTops,
    cardSelectedId,
    isRoot,
    onCardSelect,
    onCardAddChildClick,
    onBoardOpen,
  } = props;

  const {card} = cardTree;

  const draggableCard = useDraggable({id: card.id});

  const handleCardClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onCardSelect(card.id);
  };

  const handleCardDoubleClick = (event: React.MouseEvent) => {
    if (card.isSubboardRoot) {
      event.stopPropagation();
      onBoardOpen(cardSubboardId(card.id));
    }
  };

  const handleAddChildClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onCardAddChildClick(card);
  };

  const handleOpenBoard = (event: React.MouseEvent) => {
    event.stopPropagation();
    onBoardOpen(cardSubboardId(card.id));
  };

  const isSelected = cardSelectedId === card.id;

  const isDroppable = (
    (isRoot && cardTree.card.parentCardId === null) ||
    !isRoot
  );

  return (
    <div className="CardsView-TreeView">
      {cardTree.card.parentCardId !== null && isRoot && (
        <ParentPlaceholder />
      )}
      <div className="CardsView-TreeView-Parent">
        <div
          ref={draggableCard.setNodeRef}
          style={{
            opacity: draggableCard.isDragging ? 0.5 : 1,
          }}
          {...draggableCard.listeners}
          {...draggableCard.attributes}
        >
          {isDroppable && (
            <CardDroppable
              moveTo={{
                type: "before",
                cardId: cardTree.card.id,
                parentCardId: cardTree.card.parentCardId,
              }}
            />
          )}
          <CardView
            allColors={allColors}
            card={card}
            cardCategory={allCategories.findCategoryById(card.categoryId)}
            isSelected={isSelected && !draggableCard.active}
            onClick={handleCardClick}
            onDoubleClick={handleCardDoubleClick}
          />
          {isDroppable && (
            <CardDroppable
              moveTo={{
                type: "after",
                cardId: cardTree.card.id,
                parentCardId: cardTree.card.parentCardId,
              }}
            />
          )}
        </div>
        {isSelected && (
          <div className="CardsView-ChildButtonContainer">
            {card.isSubboardRoot && !isRoot ? (
              <button
                type="button"
                aria-label="Open subboard"
                className="CardsView-ChildButton"
                onClick={handleOpenBoard}
              >
                <ArrowRightIcon size={14} className="CardsView-ChildButtonIcon" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Add child"
                className="CardsView-ChildButton"
                onClick={handleAddChildClick}
              >
                <PlusIcon size={14} className="CardsView-ChildButtonIcon" />
              </button>
            )}
          </div>
        )}
      </div>
      {cardTree.card.isSubboardRoot && !isRoot && (
        <SubboardPlaceholder />
      )}
      {cardTree.children.length > 0 && (
        <>
          <Branches
            cardTops={cardTops}
            childCardTrees={cardTree.children}
            parentCard={card}
          />
          <CardList
            allCategories={allCategories}
            allColors={allColors}
            cardTrees={cardTree.children}
            cardTops={cardTops}
            cardSelectedId={cardSelectedId}
            isRoot={false}
            onCardSelect={onCardSelect}
            onCardAddChildClick={onCardAddChildClick}
            onBoardOpen={onBoardOpen}
          />
        </>
      )}
    </div>
  );
}

interface CardListProps {
  allCategories: CategorySet;
  allColors: ColorSet;
  cardTrees: ReadonlyArray<CardTree>;
  cardTops: {[cardId: string]: number};
  cardSelectedId: string | null;
  isRoot: boolean;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (card: Card) => void;
  onBoardOpen: (boardId: BoardId) => void;
}

function CardList(props: CardListProps) {
  const {
    allCategories,
    allColors,
    cardTrees,
    cardTops,
    cardSelectedId,
    isRoot,
    onCardSelect,
    onCardAddChildClick,
    onBoardOpen,
  } = props;

  return (
    <div className="CardsView-CardList">
      {cardTrees.map(cardTree => (
        <CardTreeView
          key={cardTree.card.id}
          allCategories={allCategories}
          allColors={allColors}
          cardTree={cardTree}
          cardTops={cardTops}
          cardSelectedId={cardSelectedId}
          isRoot={isRoot}
          onCardSelect={onCardSelect}
          onCardAddChildClick={onCardAddChildClick}
          onBoardOpen={onBoardOpen}
        />
      ))}
    </div>
  );
}

interface MoveTo {
  type: "before" | "after";
  cardId: string;
  parentCardId: string | null;
}

type DroppableData = MoveTo;

interface CardDroppableProps {
  moveTo: MoveTo;
}

function CardDroppable(props: CardDroppableProps) {
  const {moveTo} = props;

  const droppableData: DroppableData = moveTo;

  const {isOver, setNodeRef} = useDroppable({
    id: `${moveTo.type}_${moveTo.cardId}`,
    data: droppableData
  });

  return (
    <div
      className="CardsView-CardDroppable"
      ref={setNodeRef}
    >
      {isOver && (
        <div
          className={classNames(
            "CardsView-CardDroppableActive",
            {
              "CardsView-CardDroppableActive--Before": moveTo.type === "before",
              "CardsView-CardDroppableActive--After": moveTo.type === "after",
            },
          )}
        >
        </div>
      )}
    </div>
  );
}

function ParentPlaceholder() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${parentChildGap} ${cardHeight}`}
      width={parentChildGap}
      height={cardHeight}
    >
      <defs>
        <linearGradient
          id="fade"
          x1={0}
          y1={Math.floor(cardHeight / 2) + 0.5}
          x2={parentChildGap}
          y2={Math.floor(cardHeight / 2) + 0.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopOpacity="0" stopColor={branchStroke} offset="0" />
          <stop stopOpacity="1" stopColor={branchStroke} offset="1" />
        </linearGradient>
      </defs>
      <line
        x1={0}
        y1={Math.floor(cardHeight / 2) + 0.5}
        x2={parentChildGap}
        y2={Math.floor(cardHeight / 2) + 0.5}
        stroke="url(#fade)"
      />
    </svg>
  );
}

function SubboardPlaceholder() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${parentChildGap} ${cardHeight}`}
      width={parentChildGap}
      height={cardHeight}
    >
      <defs>
        <linearGradient
          id="fade"
          x1={0}
          y1={Math.floor(cardHeight / 2) + 0.5}
          x2={parentChildGap}
          y2={Math.floor(cardHeight / 2) + 0.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopOpacity="1" stopColor={branchStroke} offset="0" />
          <stop stopOpacity="0" stopColor={branchStroke} offset="1" />
        </linearGradient>
      </defs>
      <line
        x1={0}
        y1={Math.floor(cardHeight / 2) + 0.5}
        x2={parentChildGap}
        y2={Math.floor(cardHeight / 2) + 0.5}
        stroke="url(#fade)"
      />
    </svg>
  );
}

interface BranchesProps {
  cardTops: {[cardId: string]: number};
  childCardTrees: ReadonlyArray<CardTree>;
  parentCard: Card;
}

const parentChildGap = 100;
const branchStroke = "#666";

function Branches(props: BranchesProps) {
  const {cardTops, childCardTrees, parentCard} = props;

  const lastChild = childCardTrees.length === 0
    ? null
    : childCardTrees[childCardTrees.length - 1];

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
