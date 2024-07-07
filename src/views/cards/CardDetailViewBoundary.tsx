import { Instant } from "@js-joda/core";
import { Card, CardSet } from "../../app/cards";
import { CategorySet } from "../../app/categories";
import { ColorSet } from "../../app/colors";
import { CommentSet } from "../../app/comments";
import { generateId } from "../../app/ids";
import { requests } from "../../app/snapshots";
import { allCategoriesQuery } from "../../backendConnections/queries";
import Boundary from "../Boundary";
import CardDetailView from "./CardDetailView";

interface CardDetailViewBoundaryProps {
  appSnapshot: CardSet & CategorySet & ColorSet & CommentSet;
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
      }}
      render={({allCategories}, sendRequest) => (
        <CardDetailView
          allCategories={allCategories}
          appSnapshot={appSnapshot}
          card={card}
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
          selectedSubboardRootId={selectedSubboardRootId}
        />
      )}
    />
  );
}
