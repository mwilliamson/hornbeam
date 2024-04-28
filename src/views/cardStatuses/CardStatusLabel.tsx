import { CardStatus } from "../../app/cardStatuses";
import assertNever from "../../util/assertNever";

interface CardStatusLabelProps {
  showNone?: boolean;
  value: CardStatus;
}

export default function CardStatusLabel(props: CardStatusLabelProps) {
  const {showNone, value} = props;

  switch (value) {
    case CardStatus.None:
      return showNone ? "None" : null;
    case CardStatus.Deleted:
      return "Deleted";
    case CardStatus.Done:
      return "Done";
    default:
      return assertNever(value, null);
  }
}
