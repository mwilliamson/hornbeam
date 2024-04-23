import { groupBy, partition } from "lodash";

import { Card } from "./cards";
import { Lens } from "./lenses";
import { mapNotNull } from "../util/arrays";

export interface CardTree {
  card: Card;
  children: ReadonlyArray<CardTree>;
}

export function cardsToTrees(cards: ReadonlyArray<Card>, lens: Lens): ReadonlyArray<CardTree> {
  const [topLevelCards, nonTopLevelCards] = partition(
    cards,
    card => card.parentCardId === null,
  );

  const cardsByParentId = groupBy(nonTopLevelCards, card => card.parentCardId);

  const cardToTree = (card: Card): CardTree | null => {
    if (lens.rule.condition.statuses.includes(card.status)) {
      return null;
    }

    return {
      card,
      children: mapNotNull(cardsByParentId[card.id] ?? [], cardToTree),
    };
  };

  return mapNotNull(topLevelCards, cardToTree);
}
