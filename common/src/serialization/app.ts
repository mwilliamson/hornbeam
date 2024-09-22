import { Instant } from "@js-joda/core";
import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";

import { AppUpdate } from "../app/snapshots";
import * as t2 from "../util/io-ts";
import { SerializedCardStatus } from "./cardStatuses";
import { SerializedColorRef } from "./colors";

const SerializedCardAddMutation = t.type({
  categoryId: t.string,
  createdAt: t2.withDefault(t2.instant, Instant.ofEpochMilli(1713386548306)),
  id: t.string,
  parentCardId: t.union([t.string, t.null]),
  text: t.string,
}, "SerializedCardAddMutation");

const SerializedCardEditMutation = t.intersection([
  t.type({
    createdAt: t2.withDefault(t2.instant, Instant.ofEpochMilli(1713386548306)),
    id: t.string,
  }),
  t.partial({
    categoryId: t.string,
    isSubboardRoot: t.boolean,
    parentCardId: t.union([t.string, t.null]),
    status: SerializedCardStatus,
    text: t.string,
  }),
], "SerializedCardEditMutation");

const SerializedCardMoveMutation = t.type({
  createdAt: t2.instant,
  direction: t.keyof({"down": null, "up": null}),
  id: t.string,
}, "SerializedCardMoveMutation");

const SerializedCardMoveToAfterMutation = t.type({
  createdAt: t2.instant,
  afterCardId: t.string,
  moveCardId: t.string,
  parentCardId: t.union([t.string, t.null]),
}, "SerializedCardMoveToAfterMutation");

const SerializedCardMoveToBeforeMutation = t.type({
  createdAt: t2.instant,
  beforeCardId: t.string,
  moveCardId: t.string,
  parentCardId: t.union([t.string, t.null]),
}, "SerializedCardMoveToBeforeMutation");

const SerializedCategoryAddMutation = t.type({
  createdAt: t2.instant,
  color: SerializedColorRef,
  id: t.string,
  name: t.string,
}, "SerializedCategoryAddMutation");

const SerializedCategoryReorderMutation = t.type({
  createdAt: t2.instant,
  ids: t.readonlyArray(t.string),
}, "SerializedCategoryReorderMutation");

const SerializedCommentAddMutation = t.type({
  cardId: t.string,
  createdAt: t2.instant,
  id: t.string,
  text: t.string,
}, "SerializedCommentAddMutation");

const SerializedProjectContentsMutation = t.union([
  t.type({type: t.literal("cardAdd"), cardAdd: SerializedCardAddMutation}),
  t.type({type: t.literal("cardEdit"), cardEdit: SerializedCardEditMutation}),
  t.type({type: t.literal("cardMove"), cardMove: SerializedCardMoveMutation}),
  t.type({type: t.literal("cardMoveToAfter"), cardMoveToAfter: SerializedCardMoveToAfterMutation}),
  t.type({type: t.literal("cardMoveToBefore"), cardMoveToBefore: SerializedCardMoveToBeforeMutation}),
  t.type({type: t.literal("categoryAdd"), categoryAdd: SerializedCategoryAddMutation}),
  t.type({type: t.literal("categoryReorder"), categoryReorder: SerializedCategoryReorderMutation}),
  t.type({type: t.literal("commentAdd"), commentAdd: SerializedCommentAddMutation}),
]);

export const SerializedAppUpdate = t.type({
  updateId: t.string,
  mutation: SerializedProjectContentsMutation,
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
