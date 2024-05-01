import { groupBy, partition } from "lodash";

import { mapNotNull } from "../util/arrays";
import { Card } from "./cards";

export interface CardTree {
  card: Card;
  children: ReadonlyArray<CardTree>;
}

export function cardsToTrees(
  cards: ReadonlyArray<Card>,
  selectedSubboardRootId: string | null,
): ReadonlyArray<CardTree> {
  const [topLevelCards, nonTopLevelCards] = partition(
    cards,
    card => card.parentCardId === null,
  );

  const cardsByParentId = groupBy(nonTopLevelCards, card => card.parentCardId);

  const cardToTree = (card: Card): CardTree => {
    const children = card.isSubboardRoot
      ? []
      : cardChildrenToTrees(card);

    return {
      card,
      children,
    };
  };

  const cardChildrenToTrees = (card: Card): ReadonlyArray<CardTree> => {
    return (cardsByParentId[card.id] ?? []).map(cardToTree);
  };

  const selectedSubboardRoot = selectedSubboardRootId === null
    ? null
    : cards.find(card => card.isSubboardRoot && card.id === selectedSubboardRootId) ?? null;

  if (selectedSubboardRoot === null) {
    return mapNotNull(topLevelCards, cardToTree);
  } else {
    return [
      {
        card: selectedSubboardRoot,
        children: cardChildrenToTrees(selectedSubboardRoot),
      }
    ];
  }
}
