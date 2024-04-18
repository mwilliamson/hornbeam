import { CardSet } from "../../app/cards";

interface CardParentViewProps {
  allCards: CardSet;
  parentCardId: string | null;
}

export default function CardParentView(props: CardParentViewProps) {
  const {allCards, parentCardId} = props;

  const parent = parentCardId === null
    ? null
    : allCards.findCardById(parentCardId);

  return parent === null ? "None" : `${parent.text} (#${parent.number})`;
}
