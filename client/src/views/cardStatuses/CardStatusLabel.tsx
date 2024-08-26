import { CardStatus } from "hornbeam-common/lib/app/cardStatuses";
import { handleNever } from "hornbeam-common/lib/util/assertNever";

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
      return handleNever(value, null);
  }
}
