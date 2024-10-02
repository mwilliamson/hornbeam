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
  parentCardId: t.union([t.string, t.null]),
  projectId: t.string,
  text: t.string,
}, "SerializedCardAddMutation");

const SerializedCardAddEffect = t.intersection([
  SerializedCardAddMutation,
  t.type({
    createdAt: t2.withDefault(t2.instant, Instant.ofEpochMilli(1713386548306)),
    id: t.string,
  }),
], "SerializedCardAddMutation");

const SerializedCardEditMutation = t.intersection([
  t.type({
    id: t.string,
    projectId: t.string,
  }),
  t.partial({
    categoryId: t.string,
    isSubboardRoot: t.boolean,
    parentCardId: t.union([t.string, t.null]),
    status: SerializedCardStatus,
    text: t.string,
  }),
], "SerializedCardEditMutation");

const SerializedCardEditEffect = t.intersection([
  SerializedCardEditMutation,
  t.type({
    createdAt: t2.withDefault(t2.instant, Instant.ofEpochMilli(1713386548306)),
    id: t.string,
  }),
], "SerializedCardEditEffect");

const SerializedCardMoveMutation = t.type({
  direction: t.keyof({"down": null, "up": null}),
  id: t.string,
  projectId: t.string,
}, "SerializedCardMoveMutation");

const SerializedCardMoveEffect = t.intersection([
  SerializedCardMoveMutation,
  t.type({
    createdAt: t2.instant,
  }),
], "SerializedCardMoveEffect");

const SerializedCardMoveToAfterMutation = t.type({
  afterCardId: t.string,
  moveCardId: t.string,
  parentCardId: t.union([t.string, t.null]),
  projectId: t.string,
}, "SerializedCardMoveToAfterMutation");

const SerializedCardMoveToAfterEffect = t.intersection([
  SerializedCardMoveToAfterMutation,
  t.type({
    createdAt: t2.instant,
  }),
], "SerializedCardMoveToAfterEffect");

const SerializedCardMoveToBeforeMutation = t.type({
  beforeCardId: t.string,
  moveCardId: t.string,
  parentCardId: t.union([t.string, t.null]),
  projectId: t.string,
}, "SerializedCardMoveToBeforeMutation");

const SerializedCardMoveToBeforeEffect = t.intersection([
  SerializedCardMoveToBeforeMutation,
  t.type({
    createdAt: t2.instant,
  }),
], "SerializedCardMoveToBeforeEffect");

const SerializedCategoryAddMutation = t.type({
  color: SerializedColorRef,
  name: t.string,
  projectId: t.string,
}, "SerializedCategoryAddMutation");

const SerializedCategoryAddEffect = t.intersection([
  SerializedCategoryAddMutation,
  t.type({
    createdAt: t2.instant,
    id: t.string,
  }),
], "SerializedCategoryAddEffect");

const SerializedCategoryReorderMutation = t.type({
  ids: t.readonlyArray(t.string),
  projectId: t.string,
}, "SerializedCategoryReorderMutation");

const SerializedCategoryReorderEffect = t.intersection([
  SerializedCategoryReorderMutation,
  t.type({
    createdAt: t2.instant,
  }),
], "SerializedCategoryReorderEffect");

const SerializedCommentAddMutation = t.type({
  cardId: t.string,
  projectId: t.string,
  text: t.string,
}, "SerializedCommentAddMutation");

const SerializedCommentAddEffect = t.intersection([
  SerializedCommentAddMutation,
  t.type({
    createdAt: t2.instant,
    id: t.string,
  }),
], "SerializedCommentAddEffect");

export const SerializedProjectContentsMutation = t.union([
  t.type({type: t.literal("cardAdd"), value: SerializedCardAddMutation}),
  t.type({type: t.literal("cardEdit"), value: SerializedCardEditMutation}),
  t.type({type: t.literal("cardMove"), value: SerializedCardMoveMutation}),
  t.type({type: t.literal("cardMoveToAfter"), value: SerializedCardMoveToAfterMutation}),
  t.type({type: t.literal("cardMoveToBefore"), value: SerializedCardMoveToBeforeMutation}),
  t.type({type: t.literal("categoryAdd"), value: SerializedCategoryAddMutation}),
  t.type({type: t.literal("categoryReorder"), value: SerializedCategoryReorderMutation}),
  t.type({type: t.literal("commentAdd"), value: SerializedCommentAddMutation}),
]);

export const SerializedProjectContentsEffect = t.union([
  t.type({type: t.literal("cardAdd"), value: SerializedCardAddEffect}),
  t.type({type: t.literal("cardEdit"), value: SerializedCardEditEffect}),
  t.type({type: t.literal("cardMove"), value: SerializedCardMoveEffect}),
  t.type({type: t.literal("cardMoveToAfter"), value: SerializedCardMoveToAfterEffect}),
  t.type({type: t.literal("cardMoveToBefore"), value: SerializedCardMoveToBeforeEffect}),
  t.type({type: t.literal("categoryAdd"), value: SerializedCategoryAddEffect}),
  t.type({type: t.literal("categoryReorder"), value: SerializedCategoryReorderEffect}),
  t.type({type: t.literal("commentAdd"), value: SerializedCommentAddEffect}),
]);

export const SerializedProjectAddMutation = t.type({
  name: t.string,
}, "SerializedProjectAddMutation");

export const SerializedProjectAddEffect = t.intersection([
  SerializedProjectAddMutation,
  t.type({
    createdAt: t2.instant,
    id: t.string,
  })
], "SerializedProjectAddEffect");

export const SerializedAppMutation = t.union([
  t.type({type: t.literal("projectAdd"), value: SerializedProjectAddMutation}),
  SerializedProjectContentsMutation,
]);

export const SerializedAppEffect = t.union([
  t.type({type: t.literal("projectAdd"), value: SerializedProjectAddEffect}),
  SerializedProjectContentsEffect,
]);

export const SerializedAppUpdate = t.type({
  updateId: t.string,
  mutation: SerializedAppEffect,
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
