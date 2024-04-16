import { AppUpdate, CardAddRequest, CardDeleteRequest, CardEditRequest } from "./app";

interface SerializedAppUpdate {
  updateId: string;
  request: SerializedRequest;
}

type SerializedRequest =
  | {type: "cardAdd", cardAdd: CardAddRequest}
  | {type: "cardDelete", cardDelete: CardDeleteRequest}
  | {type: "cardEdit", cardEdit: CardEditRequest};

export function serializeAppUpdate(update: AppUpdate): SerializedAppUpdate {
  return update;
}

export function deserializeAppUpdate(untypedUpdate: unknown): AppUpdate {
  const serializedUpdate = untypedUpdate as SerializedAppUpdate;

  return serializedUpdate;
}
