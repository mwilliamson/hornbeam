import * as t from "io-ts";

export const SerializedBoardId = t.readonly(t.type({
  boardRootId: t.union([t.string, t.null]),
}, "SerializedBoardId"));
