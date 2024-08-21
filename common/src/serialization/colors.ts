import * as t from "io-ts";

export const Color = t.readonly(t.type({
  presetColorId: t.string,
}, "Color"));
