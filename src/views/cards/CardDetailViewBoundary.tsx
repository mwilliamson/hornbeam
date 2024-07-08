import { Instant } from "@js-joda/core";
import { Card, CardSet } from "../../app/cards";
import { CommentSet } from "../../app/comments";
import { generateId } from "../../app/ids";
import { requests } from "../../app/snapshots";
import { allCategoriesQuery, allColorsQuery, cardHistoryQuery, parentCardQuery } from "../../backendConnections/queries";
import Boundary from "../Boundary";
import CardDetailView from "./CardDetailView";

interface CardDetailViewBoundaryProps {
  appSnapshot: CardSet & CommentSet;
  card: Card;
  onAddChildClick: () => void;
  onSubboardOpen: (subboardRootId: string | null) => void;
  selectedSubboardRootId: string | null;
}

export default function CardDetailViewBoundary(props: CardDetailViewBoundaryProps) {
  const {appSnapshot, card, onAddChildClick, onSubboardOpen, selectedSubboardRootId} = props;

  return (
    <Boundary
      queries={{
        allCategories: allCategoriesQuery,
        allColors: allColorsQuery,
        cardHistory: cardHistoryQuery(card.id),
        parentCard: parentCardQuery(card.id),
      }}
      render={({allCategories, allColors, cardHistory, parentCard}, sendRequest) => (
        <CardDetailView
          allCategories={allCategories}
          allColors={allColors}
          appSnapshot={appSnapshot}
          card={card}
          cardHistory={cardHistory}
          onAddChildClick={onAddChildClick}
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
