import { Instant } from "@js-joda/core";
import { BoardId } from "hornbeam-common/lib/app/boards";
import { Card } from "hornbeam-common/lib/app/cards";
import { CardStatus } from "hornbeam-common/lib/app/cardStatuses";
import { boardContentsMutations } from "hornbeam-common/lib/app/snapshots";
import { allCategoriesQuery, allColorsQuery, boardCardTreesQuery } from "hornbeam-common/lib/queries";
import Boundary from "./Boundary";
import CardsView from "./CardsView";

interface CardsViewBoundaryProps {
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (card: Card) => void;
  onBoardOpen: (boardId: BoardId) => void;
  selectedBoardId: BoardId;
  visibleCardStatuses: ReadonlySet<CardStatus>;
}

export default function CardsViewBoundary(props: CardsViewBoundaryProps) {
  const {
    cardSelectedId,
    onCardSelect,
    onCardAddChildClick,
    onBoardOpen,
    selectedBoardId,
    visibleCardStatuses,
  } = props;

  return (
    <Boundary
      queries={{
        allCategories: allCategoriesQuery,
        allColors: allColorsQuery,
        boardCardTrees: boardCardTreesQuery({
          cardStatuses: visibleCardStatuses,
          boardId: selectedBoardId,
        }),
      }}
      render={({allCategories, allColors, boardCardTrees: boardCards}, mutate) => (
        <CardsView
          allCategories={allCategories}
          allColors={allColors}
          cardTrees={boardCards}
          cardSelectedId={cardSelectedId}
          onCardMoveToAfter={async (mutation) => {
            await mutate(boardContentsMutations.cardMoveToAfter({
              ...mutation,
              createdAt: Instant.now(),
            }));
          }}
          onCardMoveToBefore={async (mutation) => {
            await mutate(boardContentsMutations.cardMoveToBefore({
              ...mutation,
              createdAt: Instant.now(),
            }));
          }}
          onCardSelect={onCardSelect}
          onCardAddChildClick={onCardAddChildClick}
          onBoardOpen={onBoardOpen}
        />
      )}
    />
  );
}
