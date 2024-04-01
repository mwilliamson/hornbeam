import { AppUpdate, CardAddRequest } from "./app";

type SerializedAppUpdate =
  | {type: "cardAdd", request: CardAddRequest};

export function serializeAppUpdate(update: AppUpdate): SerializedAppUpdate {
  return update;
}

export function deserializeAppUpdate(untypedUpdate: unknown): AppUpdate {
  const serializedUpdate = untypedUpdate as AppUpdate;

  return serializedUpdate;
}
