import AsyncSelect from "react-select/async";

import { Card, CardSet } from "../../app/cards";

interface CardSelectProps {
  appSnapshot: CardSet;
  id: string;
  onChange: (value: string | null) => void;
  value: string | null;
}

export default function CardSelect(props: CardSelectProps) {
  const {appSnapshot, id, onChange, value} = props;

  const selectedCard = value === null ? null : appSnapshot.findCardById(value);

  return (
    <AsyncSelect<Card>
      cacheOptions
      getOptionLabel={card => `${card.text} (#${card.number})`}
      getOptionValue={card => card.id}
      id={id}
      loadOptions={query => Promise.resolve(appSnapshot.searchCards(query))}
      onChange={value => onChange(value === null ? null : value.id)}
      value={selectedCard}
    />
  );
}
