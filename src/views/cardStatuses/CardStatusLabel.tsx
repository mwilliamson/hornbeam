import { CardStatus } from "../../app/cardStatuses";
import assertNever from "../../util/assertNever";

interface CardStatusLabelProps {
  value: CardStatus;
}

export default function CardStatusLabel(props: CardStatusLabelProps) {
  const {value} = props;

  switch (value) {
    case CardStatus.None:
      return null;
    case CardStatus.Deleted:
      return "Deleted";
    case CardStatus.Done:
      return "Done";
    default:
      return assertNever(value, null);
  }
}
