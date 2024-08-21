import * as t from "io-ts";

export const SerializedColor = t.readonly(t.type({
  hex: t.string,
}, "SerializedColor"));

export const SerializedPresetColor = t.readonly(t.type({
  id: t.string,
  name: t.string,
  color: SerializedColor,
}, "SerializedPresetColor"));

export const SerializedColorRef = t.readonly(t.type({
  presetColorId: t.string,
}, "SerializedColorRef"));
