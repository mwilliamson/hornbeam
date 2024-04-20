import { useState } from "react";
import { CardStatus } from "../../app/cardStatuses";
import CardStatusSelect from "./CardStatusSelect";

export default {
  NoSelection: () => {
    const [status, setStatus] = useState<CardStatus | null>(null);

    return (
      <CardStatusSelect onChange={newStatus => setStatus(newStatus)} value={status} />
    );
  },

  Selection: () => {
    const [status, setStatus] = useState<CardStatus | null>(CardStatus.Deleted);

    return (
      <CardStatusSelect onChange={newStatus => setStatus(newStatus)} value={status} />
    );
  },
};
