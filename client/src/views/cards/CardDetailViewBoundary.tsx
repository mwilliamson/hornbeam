import { Instant } from "@js-joda/core";
import { BoardId } from "hornbeam-common/lib/app/boards";
import { generateId } from "hornbeam-common/lib/app/ids";
import { projectContentsMutations } from "hornbeam-common/lib/app/snapshots";
import { allCategoriesQuery, allColorsQuery, cardChildCountQuery, cardHistoryQuery, cardQuery, parentCardQuery, searchCardsQuery } from "hornbeam-common/lib/queries";
import Boundary from "../Boundary";
import CardDetailView from "./CardDetailView";
import { CardFormInitialState } from "./CardForm";

interface CardDetailViewBoundaryProps {
  cardId: string;
  onCardAddClick: (initialCard: CardFormInitialState) => void;
  onBoardOpen: (boardId: BoardId) => void;
  selectedBoardId: BoardId;
}

export default function CardDetailViewBoundary(props: CardDetailViewBoundaryProps) {
  const {cardId, onCardAddClick, onBoardOpen, selectedBoardId} = props;

  return (
    <Boundary
      queries={{
        allCategories: allCategoriesQuery,
        allColors: allColorsQuery,
        card: cardQuery(cardId),
        cardChildCount: cardChildCountQuery(cardId),
        cardHistory: cardHistoryQuery(cardId),
        parentCard: parentCardQuery(cardId),
      }}
      render={(
        {
          allCategories,
          allColors,
          card,
          cardChildCount,
          cardHistory,
          parentCard,
        },
        mutate,
        query
      // TODO: handle null card
      ) => card === null ? null : (
        <CardDetailView
          allCategories={allCategories}
          allColors={allColors}
          card={card}
          cardChildCount={cardChildCount}
          cardHistory={cardHistory}
          cardSearcher={{
            searchCards: searchTerm => query(searchCardsQuery(searchTerm)),
          }}
          onAddChildClick={() => onCardAddClick({parentCard: card})}
          onCardEdit={(mutation) => mutate(projectContentsMutations.cardEdit({
            ...mutation,
            createdAt: Instant.now(),
            id: card.id,
          }))}
          onCardMove={(direction) => mutate(projectContentsMutations.cardMove({
            createdAt: Instant.now(),
            direction,
            id: card.id,
          }))}
          onCommentAdd={(text) => mutate(projectContentsMutations.commentAdd({
            cardId: card.id,
            createdAt: Instant.now(),
            id: generateId(),
            text,
          }))}
          onBoardOpen={onBoardOpen}
          parentCard={parentCard}
          selectedBoardId={selectedBoardId}
        />
      )}
    />
  );
}
