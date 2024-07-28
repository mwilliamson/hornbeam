import { Instant } from "@js-joda/core";
import { Card } from "../app/cards";
import { requests } from "../app/snapshots";
import { allCategoriesQuery, allColorsQuery } from "../backendConnections/queries";
import Boundary from "./Boundary";
import CardsView from "./CardsView";

interface CardsViewBoundaryProps {
  cards: ReadonlyArray<Card>;
  cardSelectedId: string | null;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (card: Card) => void;
  onSubboardOpen: (subboardRootId: string) => void;
  selectedSubboardRootId: string | null;
}

export default function CardsViewBoundary(props: CardsViewBoundaryProps) {
  const {
    cards,
    cardSelectedId,
    onCardSelect,
    onCardAddChildClick,
    onSubboardOpen,
    selectedSubboardRootId,
  } = props;

  return (
    <Boundary
      queries={{
        allCategories: allCategoriesQuery,
        allColors: allColorsQuery,
      }}
      render={({allCategories, allColors}, sendRequest) => (
        <CardsView
          allCategories={allCategories}
          allColors={allColors}
          cards={cards}
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
          selectedSubboardRootId={selectedSubboardRootId}
        />
      )}
    />
  );
}
