import { Instant } from "@js-joda/core";
import { BoardId } from "hornbeam-common/lib/app/boards";
import { generateId } from "hornbeam-common/lib/app/ids";
import { appMutations } from "hornbeam-common/lib/app/snapshots";
import { allCategoriesQuery, allColorsQuery, cardChildCountQuery, cardHistoryQuery, cardQuery, parentCardQuery, searchCardsQuery } from "hornbeam-common/lib/queries";
import Boundary from "../Boundary";
import CardDetailView from "./CardDetailView";
import { CardFormInitialState } from "./CardForm";

interface CardDetailViewBoundaryProps {
  cardId: string;
  onCardAddClick: (initialCard: CardFormInitialState) => void;
  onBoardOpen: (boardId: BoardId) => void;
  projectId: string;
  selectedBoardId: BoardId;
}

export default function CardDetailViewBoundary(props: CardDetailViewBoundaryProps) {
  const {cardId, onCardAddClick, onBoardOpen, projectId, selectedBoardId} = props;

  return (
    <Boundary
      queries={{
        allCategories: allCategoriesQuery({projectId}),
        allColors: allColorsQuery({projectId}),
        card: cardQuery({cardId, projectId}),
        cardChildCount: cardChildCountQuery({cardId, projectId}),
        cardHistory: cardHistoryQuery({cardId, projectId}),
        parentCard: parentCardQuery({cardId, projectId}),
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
            searchCards: searchTerm => query(searchCardsQuery({projectId, searchTerm})),
          }}
          onAddChildClick={() => onCardAddClick({parentCard: card})}
          onCardEdit={(mutation) => mutate(appMutations.cardEdit({
            ...mutation,
            createdAt: Instant.now(),
            id: card.id,
            projectId,
          }))}
          onCardMove={(direction) => mutate(appMutations.cardMove({
            createdAt: Instant.now(),
            direction,
            id: card.id,
            projectId,
          }))}
          onCommentAdd={(text) => mutate(appMutations.commentAdd({
            cardId: card.id,
            createdAt: Instant.now(),
            id: generateId(),
            projectId,
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
