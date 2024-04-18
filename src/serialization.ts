import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";

import * as t2 from "./util/io-ts";
import { AppUpdate, CardAddRequest, CardDeleteRequest, CardEditRequest } from "./app";
import { Instant } from "@js-joda/core";

const SerializedCardAddRequest = t.type({
  categoryId: t.string,
  createdAt: t2.withDefault(t2.instant, Instant.ofEpochMilli(1713386548306)),
  id: t.string,
  parentCardId: t.union([t.string, t.null]),
  text: t.string,
}, "SerializedCardAddRequest");

const SerializedCardDeleteRequest = t.type({
  id: t.string,
}, "SerializedCardDeleteRequest");

const SerializedCardEditRequest = t.intersection([
  t.type({
    id: t.string,
  }),
  t.partial({
    categoryId: t.string,
    parentCardId: t.union([t.string, t.null]),
    text: t.string,
  }),
], "SerializedCardEditRequest");

const SerializedRequest = t.union([
  t.type({type: t.literal("cardAdd"), cardAdd: SerializedCardAddRequest}),
  t.type({type: t.literal("cardDelete"), cardDelete: SerializedCardDeleteRequest}),
  t.type({type: t.literal("cardEdit"), cardEdit: SerializedCardEditRequest})
]);

const SerializedAppUpdate = t.type({
  updateId: t.string,
  request: SerializedRequest,
}, "SerializedAppUpdate");

type SerializedRequest =
  | {type: "cardAdd", cardAdd: CardAddRequest}
  | {type: "cardDelete", cardDelete: CardDeleteRequest}
  | {type: "cardEdit", cardEdit: CardEditRequest};

export function serializeAppUpdate(update: AppUpdate): t.OutputOf<typeof SerializedAppUpdate> {
  return SerializedAppUpdate.encode(update);
}

export function deserializeAppUpdate(untypedUpdate: unknown): AppUpdate {
  const result = SerializedAppUpdate.decode(untypedUpdate);
  if (isLeft(result)) {
    throw Error(
      `Failed to deserialize app update: ${PathReporter.report(result).join("\n")}`
    );
  } else {
    return result.right;
  }
}
