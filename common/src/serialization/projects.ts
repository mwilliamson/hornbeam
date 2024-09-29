import * as t from "io-ts";

export const SerializedProject = t.readonly(t.type({
  id: t.string,
  name: t.string,
}, "SerializedProject"));
