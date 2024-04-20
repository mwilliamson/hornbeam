import { CardSet } from "../../app/cards";

interface CardParentViewProps {
  appSnapshot: CardSet;
  parentCardId: string | null;
}

export default function CardParentView(props: CardParentViewProps) {
  const {appSnapshot, parentCardId} = props;

  const parent = parentCardId === null
    ? null
    : appSnapshot.findCardById(parentCardId);

  return parent === null ? "None" : `${parent.text} (#${parent.number})`;
}
