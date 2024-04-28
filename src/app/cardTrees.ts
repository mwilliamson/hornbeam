import { groupBy, partition } from "lodash";

import { mapNotNull } from "../util/arrays";
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

  const cardToTree = (card: Card): CardTree | null => {
    return {
      card,
      children: mapNotNull(cardsByParentId[card.id] ?? [], cardToTree),
    };
  };

  return mapNotNull(topLevelCards, cardToTree);
}
