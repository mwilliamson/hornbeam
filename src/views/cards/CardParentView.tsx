import { CardSet } from "../../app/cards";

interface CardParentViewProps {
  appState: CardSet;
  parentCardId: string | null;
}

export default function CardParentView(props: CardParentViewProps) {
  const {appState, parentCardId} = props;

  const parent = parentCardId === null
    ? null
    : appState.findCardById(parentCardId);

  return parent === null ? "None" : `${parent.text} (#${parent.number})`;
}
