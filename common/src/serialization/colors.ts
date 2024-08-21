import * as t from "io-ts";

export const SerializedColor = t.readonly(t.type({
  presetColorId: t.string,
}, "SerializedColor"));
