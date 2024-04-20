import { CardStatus } from "../../app/cardStatuses";

interface CardStatusLabelProps {
  value: CardStatus | null;
}

export default function CardStatusLabel(props: CardStatusLabelProps) {
  const {value} = props;

  return value === null ? "None" : value;
}
