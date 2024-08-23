import { CardStatus, allCardStatuses } from "hornbeam-common/lib/app/cardStatuses";
import CardStatusLabel from "./CardStatusLabel";

interface CardStatusSelectProps {
  id?: string;
  onChange: (value: CardStatus) => void;
  value: CardStatus;
}

export default function CardStatusSelect(props: CardStatusSelectProps) {
  const {id, onChange, value} = props;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value as CardStatus;

    onChange(newValue);
  };

  return (
    <select id={id} onChange={handleChange} value={value ?? ""}>
      {allCardStatuses.map(cardStatus => (
        <option key={cardStatus} value={cardStatus}>
          <CardStatusLabel value={cardStatus} />
        </option>
      ))}
    </select>
  );
}
