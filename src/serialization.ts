import { Instant } from "@js-joda/core";
import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";

import { AppUpdate } from "./app/snapshots";
import { CardStatus } from "./app/cardStatuses";
import * as t2 from "./util/io-ts";

const SerializedCardStatus = t.keyof({
  [CardStatus.Deleted]: null,
  [CardStatus.Done]: null,
});

const SerializedCardAddRequest = t.type({
  categoryId: t.string,
  createdAt: t2.withDefault(t2.instant, Instant.ofEpochMilli(1713386548306)),
  id: t.string,
  parentCardId: t.union([t.string, t.null]),
  text: t.string,
}, "SerializedCardAddRequest");

const SerializedCardEditRequest = t.intersection([
  t.type({
    createdAt: t2.withDefault(t2.instant, Instant.ofEpochMilli(1713386548306)),
    id: t.string,
  }),
  t.partial({
    categoryId: t.string,
    parentCardId: t.union([t.string, t.null]),
    status: t.union([SerializedCardStatus, t.null]),
    text: t.string,
  }),
], "SerializedCardEditRequest");

const SerializedCardMoveRequest = t.type({
  createdAt: t2.instant,
  direction: t.keyof({"down": null, "up": null}),
  id: t.string,
}, "SerializedCardMoveRequest");

const SerializedCategoryAddRequest = t.type({
  createdAt: t2.instant,
  color: t.type({presetColorId: t.string}),
  id: t.string,
  name: t.string,
}, "SerializedCategoryAddRequest");

const SerializedCategoryReorderRequest = t.type({
  createdAt: t2.instant,
  ids: t.readonlyArray(t.string),
}, "SerializedCategoryReorderRequest");

const SerializedCommentAddRequest = t.type({
  cardId: t.string,
  createdAt: t2.instant,
  id: t.string,
  text: t.string,
}, "SerializedCommentAddRequest");

const SerializedRequest = t.union([
  t.type({type: t.literal("cardAdd"), cardAdd: SerializedCardAddRequest}),
  t.type({type: t.literal("cardEdit"), cardEdit: SerializedCardEditRequest}),
  t.type({type: t.literal("cardMove"), cardMove: SerializedCardMoveRequest}),
  t.type({type: t.literal("categoryAdd"), categoryAdd: SerializedCategoryAddRequest}),
  t.type({type: t.literal("categoryReorder"), categoryReorder: SerializedCategoryReorderRequest}),
  t.type({type: t.literal("commentAdd"), commentAdd: SerializedCommentAddRequest}),
]);

const SerializedAppUpdate = t.type({
  updateId: t.string,
  request: SerializedRequest,
}, "SerializedAppUpdate");

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
