import * as t from "io-ts";

import * as t2 from "../util/io-ts";
import { SerializedCardStatus } from "./cardStatuses";
import { SerializedComment } from "./comments";

export const SerializedCard = t.type({
  categoryId: t.string,
  createdAt: t2.instant,
  id: t.string,
  isSubboardRoot: t.boolean,
  number: t.number,
  parentCardId: t.union([t.string, t.null]),
  status: SerializedCardStatus,
  text: t.string,
}, "SerializedCard");

export const SerializedCardEvent = t.union([
  t.type({
    type: t.literal("created"),
    instant: t2.instant,
  }),
  t.type({
    type: t.literal("comment"),
    instant: t2.instant,
    comment: SerializedComment,
  }),
], "SerializedCardEvent");
