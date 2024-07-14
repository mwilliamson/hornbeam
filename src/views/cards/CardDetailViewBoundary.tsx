import { Instant } from "@js-joda/core";
import { generateId } from "../../app/ids";
import { requests } from "../../app/snapshots";
import { allCategoriesQuery, allColorsQuery, cardChildCountQuery, cardHistoryQuery, cardQuery, cardSearcherQuery, parentCardQuery } from "../../backendConnections/queries";
import Boundary from "../Boundary";
import CardDetailView from "./CardDetailView";
import { CardFormInitialState } from "./CardForm";

interface CardDetailViewBoundaryProps {
  cardId: string;
  onCardAddClick: (initialCard: CardFormInitialState) => void;
  onSubboardOpen: (subboardRootId: string | null) => void;
  selectedSubboardRootId: string | null;
}

export default function CardDetailViewBoundary(props: CardDetailViewBoundaryProps) {
  const {cardId, onCardAddClick, onSubboardOpen, selectedSubboardRootId} = props;

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
          onSubboardOpen={onSubboardOpen}
          parentCard={parentCard}
          selectedSubboardRootId={selectedSubboardRootId}
        />
      )}
    />
  );
}
