import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import { SerializedCard } from "./cards";
import { SerializedCategory } from "./categories";

const CardServerQuery = t.type({
  type: t.literal("card"),
  cardId: t.string,
}, "CardServerQuery");

const CardResponse = t.union([
  SerializedCard,
  t.null,
]);

export const serializeCardResponse = CardResponse.encode;
export const deserializeCardResponse = deserializer(CardResponse);

const ParentCardServerQuery = t.type({
  type: t.literal("parentCard"),
  cardId: t.string,
}, "ParentCardServerQuery");

const ParentCardResponse = t.union([
  SerializedCard,
  t.null,
]);

export const serializeParentCardResponse = ParentCardResponse.encode;
export const deserializeParentCardResponse = deserializer(ParentCardResponse);

const CardChildCountServerQuery = t.type({
  type: t.literal("cardChildCount"),
  cardId: t.string,
}, "CardChildCountServerQuery");

const CardChildCountResponse = t.number;

export const serializeCardChildCountResponse = CardChildCountResponse.encode;
export const deserializeCardChildCountResponse = deserializer(CardChildCountResponse);

const AllCategoriesServerQuery = t.type({
  type: t.literal("allCategories"),
}, "AllCategoriesServerQuery");

const AllCategoriesResponse = t.readonlyArray(SerializedCategory);

export const serializeAllCategoriesResponse = AllCategoriesResponse.encode;
export const deserializeAllCategoriesResponse = deserializer(AllCategoriesResponse);

const ServerQuery = t.union([
  CardServerQuery,
  ParentCardServerQuery,
  CardChildCountServerQuery,
  AllCategoriesServerQuery,
], "SerializedAppQuery");

export type ServerQuery = t.TypeOf<typeof ServerQuery>;
export type SerializedServerQuery = t.OutputOf<typeof ServerQuery>;

export function serializeServerQuery(query: ServerQuery): SerializedServerQuery {
  return ServerQuery.encode(query);
}

export const deserializeServerQuery = deserializer(ServerQuery);

function deserializer<T>(decoder: t.Decoder<unknown, T>): (value: unknown) => T {
  return value => deserialize(decoder, value);
}

function deserialize<T>(decoder: t.Decoder<unknown, T>, value: unknown): T {
  const result = decoder.decode(value);
  if (isLeft(result)) {
    throw Error(
      `Failed to deserialize: ${PathReporter.report(result).join("\n")}`
    );
  } else {
    return result.right;
  }
}
