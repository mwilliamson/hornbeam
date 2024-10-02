import * as t from "io-ts";
import { SerializedAppEffect, SerializedAppMutation } from "./app";
import { ServerQuery } from "./serverQueries";

export const QueryRequestBody = t.type({
  queries: t.readonlyArray(ServerQuery),
}, "QueryRequestBody");

export const QueryResponseBody = t.type({
  snapshotIndex: t.number,
  results: t.readonlyArray(t.unknown),
}, "QueryResponseBody");

export const UpdateRequestBody = t.type({
  mutation: SerializedAppMutation,
}, "UpdateRequestBody");

export const UpdateResponseBody = t.readonly(t.type({
  effect: SerializedAppEffect,
  snapshotIndex: t.number,
}, "UpdateResponseBody"));
