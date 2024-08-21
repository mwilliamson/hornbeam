import * as t from "io-ts";

import { Color } from "./colors";

export const Category = t.readonly(t.type({
  color: Color,
  id: t.string,
  name: t.string,
}, "Category"));
