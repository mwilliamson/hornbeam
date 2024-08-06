import { Instant } from "@js-joda/core";
import { Card } from "../app/cards";
import { requests } from "../app/snapshots";
import { allCategoriesQuery, allColorsQuery, boardCardTreesQuery } from "../backendConnections/queries";
import Boundary from "./Boundary";
import CardsView from "./CardsView";
import { CardStatus } from "../app/cardStatuses";

interface CardsViewBoundaryProps {
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (card: Card) => void;
  onSubboardOpen: (subboardRootId: string) => void;
  selectedSubboardRootId: string | null;
  visibleCardStatuses: ReadonlySet<CardStatus>;
}

export default function CardsViewBoundary(props: CardsViewBoundaryProps) {
  const {
    cardSelectedId,
    onCardSelect,
    onCardAddChildClick,
    onSubboardOpen,
    selectedSubboardRootId,
    visibleCardStatuses,
  } = props;

  return (
    <Boundary
      queries={{
        allCategories: allCategoriesQuery,
        allColors: allColorsQuery,
        boardCardTrees: boardCardTreesQuery({
          cardStatuses: visibleCardStatuses,
          subboardRootId: selectedSubboardRootId,
        }),
      }}
      render={({allCategories, allColors, boardCardTrees: boardCards}, sendRequest) => (
        <CardsView
          allCategories={allCategories}
          allColors={allColors}
          cardTrees={boardCards}
          cardSelectedId={cardSelectedId}
          onCardMoveToAfter={async (request) => {
            await sendRequest(requests.cardMoveToAfter({
              ...request,
              createdAt: Instant.now(),
            }));
          }}
          onCardMoveToBefore={async (request) => {
            await sendRequest(requests.cardMoveToBefore({
              ...request,
              createdAt: Instant.now(),
            }));
          }}
          onCardSelect={onCardSelect}
          onCardAddChildClick={onCardAddChildClick}
          onSubboardOpen={onSubboardOpen}
        />
      )}
    />
  );
}
