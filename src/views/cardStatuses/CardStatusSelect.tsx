import { CardStatus, allCardStatuses } from "../../app/cardStatuses";

interface CardStatusSelectProps {
  id?: string;
  onChange: (value: CardStatus | null) => void;
  value: CardStatus | null;
}

export default function CardStatusSelect(props: CardStatusSelectProps) {
  const {id, onChange, value} = props;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value === ""
      ? null
      : event.target.value as CardStatus;

    onChange(newValue);
  };

  return (
    <select id={id} onChange={handleChange} value={value ?? ""}>
      <option value=""></option>
      {allCardStatuses.map(cardStatus => (
        <option key={cardStatus} value={cardStatus}>{cardStatus}</option>
      ))}
    </select>
  );
}
