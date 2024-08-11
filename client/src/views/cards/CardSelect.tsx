import AsyncSelect from "react-select/async";

import { Card, CardSearcher } from "hornbeam-common/src/app/cards";

interface CardSelectProps {
  cardSearcher: CardSearcher;
  id: string;
  onChange: (value: Card | null) => void;
  value: Card | null;
}

export default function CardSelect(props: CardSelectProps) {
  const {cardSearcher, id, onChange, value} = props;

  return (
    <AsyncSelect<Card>
      cacheOptions
      getOptionLabel={card => `${card.text} (#${card.number})`}
      getOptionValue={card => card.id}
      id={id}
      loadOptions={query => cardSearcher.searchCards(query)}
      onChange={value => onChange(value)}
      value={value}
    />
  );
}
