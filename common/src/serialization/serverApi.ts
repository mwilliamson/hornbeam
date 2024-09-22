import * as t from "io-ts";
import { SerializedAppUpdate } from "./app";
import { ServerQuery } from "./serverQueries";

export const QueryRequestBody = t.type({
  queries: t.readonlyArray(ServerQuery),
}, "QueryRequestBody");

export const QueryResponseBody = t.type({
  snapshotIndex: t.number,
  results: t.readonlyArray(t.unknown),
}, "QueryResponseBody");

export const UpdateRequestBody = t.type({
  update: SerializedAppUpdate,
}, "UpdateRequestBody");

export const UpdateResponseBody = t.readonly(t.type({
  snapshotIndex: t.number,
}, "UpdateResponseBody"));
