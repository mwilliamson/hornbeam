import * as t from "io-ts";

import { CardStatus } from "../app/cardStatuses";

export const SerializedCardStatus = t.keyof({
  [CardStatus.Deleted]: null,
  [CardStatus.Done]: null,
  [CardStatus.None]: null,
});
