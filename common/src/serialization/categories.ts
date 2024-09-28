import * as t from "io-ts";

import { SerializedColorRef } from "./colors";

export const SerializedCategory = t.readonly(t.type({
  color: SerializedColorRef,
  id: t.string,
  name: t.string,
  projectId: t.string,
}, "SerializedCategory"));
