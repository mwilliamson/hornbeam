import * as t from "io-ts";

import * as t2 from "../util/io-ts";
import { SerializedCardStatus } from "./app";

export const Card = t.type({
  categoryId: t.string,
  createdAt: t2.instant,
  id: t.string,
  isSubboardRoot: t.boolean,
  number: t.number,
  parentCardId: t.union([t.string, t.null]),
  status: SerializedCardStatus,
  text: t.string,
}, "Card");
