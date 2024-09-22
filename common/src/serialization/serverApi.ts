import * as t from "io-ts";
import { SerializedAppUpdate } from "./app";
import { ServerQuery } from "./serverQueries";

export const QueryRequestBody = t.type({
  queries: t.readonlyArray(ServerQuery),
}, "QueryRequestBody");


export const UpdateRequestBody = t.type({
  update: SerializedAppUpdate,
}, "UpdateRequestBody");
