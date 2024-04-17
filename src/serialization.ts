import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";

import { AppUpdate, CardAddRequest, CardDeleteRequest, CardEditRequest } from "./app";

const SerializedCardAddRequest = t.type({
  categoryId: t.string,
  id: t.string,
  parentCardId: t.union([t.string, t.null]),
  text: t.string,
});

const SerializedCardDeleteRequest = t.type({
  id: t.string,
});

const SerializedCardEditRequest = t.type({
  categoryId: t.string,
  id: t.string,
  parentCardId: t.union([t.string, t.null]),
  text: t.string,
});

const SerializedRequest = t.union([
  t.type({type: t.literal("cardAdd"), cardAdd: SerializedCardAddRequest}),
  t.type({type: t.literal("cardDelete"), cardDelete: SerializedCardDeleteRequest}),
  t.type({type: t.literal("cardEdit"), cardEdit: SerializedCardEditRequest})
]);

const SerializedAppUpdate = t.type({
  updateId: t.string,
  request: SerializedRequest,
});

type SerializedRequest =
  | {type: "cardAdd", cardAdd: CardAddRequest}
  | {type: "cardDelete", cardDelete: CardDeleteRequest}
  | {type: "cardEdit", cardEdit: CardEditRequest};

export function serializeAppUpdate(update: AppUpdate): t.TypeOf<typeof SerializedAppUpdate> {
  return update;
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
