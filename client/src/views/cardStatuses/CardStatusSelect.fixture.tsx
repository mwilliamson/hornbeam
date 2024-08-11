import { useState } from "react";
import { CardStatus } from "hornbeam-common/src/app/cardStatuses";
import CardStatusSelect from "./CardStatusSelect";

export default {
  NoSelection: () => {
    const [status, setStatus] = useState(CardStatus.None);

    return (
      <CardStatusSelect onChange={newStatus => setStatus(newStatus)} value={status} />
    );
  },

  Selection: () => {
    const [status, setStatus] = useState(CardStatus.Deleted);

    return (
      <CardStatusSelect onChange={newStatus => setStatus(newStatus)} value={status} />
    );
  },
};
