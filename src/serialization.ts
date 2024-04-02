import { AppUpdate, CardAddRequest, CardDeleteRequest } from "./app";

type SerializedAppUpdate =
  | {type: "cardAdd", request: CardAddRequest}
  | {type: "cardDelete", request: CardDeleteRequest};

export function serializeAppUpdate(update: AppUpdate): SerializedAppUpdate {
  return update;
}

export function deserializeAppUpdate(untypedUpdate: unknown): AppUpdate {
  const serializedUpdate = untypedUpdate as AppUpdate;

  return serializedUpdate;
}
