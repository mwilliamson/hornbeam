import * as t from "io-ts";

import { SerializedColor } from "./colors";

export const SerializedCategory = t.readonly(t.type({
  color: SerializedColor,
  id: t.string,
  name: t.string,
}, "SerializedCategory"));
