import { Card, CardMoveToAfterRequest, CardMoveToBeforeRequest } from "../app/cards";
import { allCategoriesQuery, allColorsQuery } from "../backendConnections/queries";
import Boundary from "./Boundary";
import CardsView from "./CardsView";

interface CardsViewBoundaryProps {
  cards: ReadonlyArray<Card>;
  cardSelectedId: string | null;
  onCardMoveToAfter: (request: Omit<CardMoveToAfterRequest, "createdAt">) => void;
  onCardMoveToBefore: (request: Omit<CardMoveToBeforeRequest, "createdAt">) => void;
  onCardSelect: (cardId: string | null) => void;
  onCardAddChildClick: (card: Card) => void;
  onSubboardOpen: (subboardRootId: string) => void;
  selectedSubboardRootId: string | null;
}

export default function CardsViewBoundary(props: CardsViewBoundaryProps) {
  const {
    cards,
    cardSelectedId,
    onCardMoveToAfter,
    onCardMoveToBefore,
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
      render={({allCategories, allColors}) => (
        <CardsView
          allCategories={allCategories}
          allColors={allColors}
          cards={cards}
          cardSelectedId={cardSelectedId}
          onCardMoveToAfter={onCardMoveToAfter}
          onCardMoveToBefore={onCardMoveToBefore}
          onCardSelect={onCardSelect}
          onCardAddChildClick={onCardAddChildClick}
          onSubboardOpen={onSubboardOpen}
          selectedSubboardRootId={selectedSubboardRootId}
        />
      )}
    />
  );
}
