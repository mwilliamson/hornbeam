import { groupBy, partition } from "lodash";

import { Card } from "./cards";

export interface CardTree {
  card: Card;
  children: ReadonlyArray<CardTree>;
}

export function cardsToTrees(cards: ReadonlyArray<Card>): ReadonlyArray<CardTree> {
  const [topLevelCards, nonTopLevelCards] = partition(
    cards,
    card => card.parentCardId === null,
  );

  const cardsByParentId = groupBy(nonTopLevelCards, card => card.parentCardId);

  const cardToTree = (card: Card): CardTree => {
    return {
      card,
      children: (cardsByParentId[card.id] ?? []).map(cardToTree),
    };
  };

  return topLevelCards.map(cardToTree);
}
