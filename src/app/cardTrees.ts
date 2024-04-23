import { groupBy, partition } from "lodash";

import { mapNotNull } from "../util/arrays";
import { Card } from "./cards";
import { CardCondition, Lens } from "./lenses";

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
    if (cardMatchesCondition(card, lens.rule.condition)) {
      return null;
    }

    return {
      card,
      children: mapNotNull(cardsByParentId[card.id] ?? [], cardToTree),
    };
  };

  return mapNotNull(topLevelCards, cardToTree);
}

function cardMatchesCondition(card: Card, condition: CardCondition): boolean {
  return condition.statuses.includes(card.status);
}
