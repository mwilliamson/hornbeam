import { CardSet } from "../../app/cards";

interface CardParentViewProps {
  appSnapshot: CardSet;
  id?: string;
  parentCardId: string | null;
}

export default function CardParentView(props: CardParentViewProps) {
  const {appSnapshot, id, parentCardId} = props;

  const parent = parentCardId === null
    ? null
    : appSnapshot.findCardById(parentCardId);

  return (
    <span id={id}>
      {parent === null ? "None" : `${parent.text} (#${parent.number})`}
    </span>
  );
}
