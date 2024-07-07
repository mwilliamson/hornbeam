import { Card } from "../../app/cards";

interface CardParentViewProps {
  id?: string;
  parentCard: Card | null;
}

export default function CardParentView(props: CardParentViewProps) {
  const {id, parentCard} = props;

  return (
    <span id={id}>
      {parentCard === null ? "None" : `${parentCard.text} (#${parentCard.number})`}
    </span>
  );
}
