import * as t from "io-ts";

import * as t2 from "../util/io-ts";

export const SerializedComment = t.type({
  cardId: t.string,
  createdAt: t2.instant,
  id: t.string,
  text: t.string,
});
