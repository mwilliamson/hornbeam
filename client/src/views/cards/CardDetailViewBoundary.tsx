import { Instant } from "@js-joda/core";
import { BoardId } from "hornbeam-common/src/app/boards";
import { generateId } from "hornbeam-common/src/app/ids";
import { requests } from "hornbeam-common/src/app/snapshots";
import { allCategoriesQuery, allColorsQuery, cardChildCountQuery, cardHistoryQuery, cardQuery, cardSearcherQuery, parentCardQuery } from "../../backendConnections/queries";
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
        cardSearcher: cardSearcherQuery,
        parentCard: parentCardQuery(cardId),
      }}
      render={(
        {
          allCategories,
          allColors,
          card,
          cardChildCount,
          cardHistory,
          cardSearcher,
          parentCard,
        },
        sendRequest
      // TODO: handle null card
      ) => card === null ? null : (
        <CardDetailView
          allCategories={allCategories}
          allColors={allColors}
          card={card}
          cardChildCount={cardChildCount}
          cardHistory={cardHistory}
          cardSearcher={cardSearcher}
          onAddChildClick={() => onCardAddClick({parentCard: card})}
          onCardEdit={(request) => sendRequest(requests.cardEdit({
            ...request,
            createdAt: Instant.now(),
            id: card.id,
          }))}
          onCardMove={(direction) => sendRequest(requests.cardMove({
            createdAt: Instant.now(),
            direction,
            id: card.id,
          }))}
          onCommentAdd={(text) => sendRequest(requests.commentAdd({
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
