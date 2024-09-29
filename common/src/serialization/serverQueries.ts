import * as t from "io-ts";
import { SerializedCard, SerializedCardEvent } from "./cards";
import { SerializedCategory } from "./categories";
import { SerializedPresetColor } from "./colors";
import { SerializedCardTree } from "./cardTrees";
import { SerializedBoardId } from "./boards";
import { SerializedCardStatus } from "./cardStatuses";
import { deserializer } from "./deserialize";
import { SerializedProject } from "./projects";

const CardServerQuery = t.type({
  type: t.literal("card"),
  cardId: t.string,
  projectId: t.string,
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
  projectId: t.string,
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
  projectId: t.string,
}, "CardChildCountServerQuery");

const CardChildCountResponse = t.number;

export const serializeCardChildCountResponse = CardChildCountResponse.encode;
export const deserializeCardChildCountResponse = deserializer(CardChildCountResponse);

const CardHistoryServerQuery = t.type({
  type: t.literal("cardHistory"),
  cardId: t.string,
  projectId: t.string,
}, "CardHistoryServerQuery");

const CardHistoryResponse = t.readonlyArray(SerializedCardEvent);

export const serializeCardHistoryResponse = CardHistoryResponse.encode;
export const deserializeCardHistoryResponse = deserializer(CardHistoryResponse);

const SearchCardsServerQuery = t.type({
  type: t.literal("searchCards"),
  projectId: t.string,
  searchTerm: t.string,
});

const SearchCardsResponse = t.readonlyArray(SerializedCard);

export const serializeSearchCardsResponse = SearchCardsResponse.encode;
export const deserializeSearchCardsResponse = deserializer(SearchCardsResponse);

const BoardCardTreesServerQuery = t.type({
  type: t.literal("boardCardTrees"),
  boardId: SerializedBoardId,
  cardStatuses: t.readonlyArray(SerializedCardStatus),
  projectId: t.string,
}, "BoardCardTreesServerQuery");

const BoardCardTreesResponse = t.readonlyArray(SerializedCardTree);

export const serializeBoardCardTreesResponse = BoardCardTreesResponse.encode;
export const deserializeBoardCardTreesResponse = deserializer(BoardCardTreesResponse);

const ParentBoardServerQuery = t.type({
  type: t.literal("parentBoard"),
  boardId: SerializedBoardId,
  projectId: t.string,
});

const ParentBoardResponse = SerializedBoardId;

export const serializeParentBoardResponse = ParentBoardResponse.encode;
export const deserializeParentBoardResponse = deserializer(ParentBoardResponse);

const AllCategoriesServerQuery = t.type({
  type: t.literal("allCategories"),
  projectId: t.string,
}, "AllCategoriesServerQuery");

const AllCategoriesResponse = t.readonlyArray(SerializedCategory);

export const serializeAllCategoriesResponse = AllCategoriesResponse.encode;
export const deserializeAllCategoriesResponse = deserializer(AllCategoriesResponse);

const AllColorsServerQuery = t.type({
  type: t.literal("allColors"),
  projectId: t.string,
}, "AllColorsServerQuery");

const AllColorsResponse = t.readonlyArray(SerializedPresetColor);

export const serializeAllColorsResponse = AllColorsResponse.encode;
export const deserializeAllColorsResponse = deserializer(AllColorsResponse);

const AllProjectsServerQuery = t.type({
  type: t.literal("allProjects"),
}, "AllProjectsServerQuery");

export const ServerQuery = t.union([
  CardServerQuery,
  ParentCardServerQuery,
  CardChildCountServerQuery,
  CardHistoryServerQuery,
  SearchCardsServerQuery,
  BoardCardTreesServerQuery,
  ParentBoardServerQuery,
  AllCategoriesServerQuery,
  AllColorsServerQuery,
  AllProjectsServerQuery,
], "ServerQuery");

const AllProjectsResponse = t.readonlyArray(SerializedProject);

export const serializeAllProjectsResponse = AllProjectsResponse.encode;
export const deserializeAllProjectsResponse = deserializer(AllProjectsResponse);

export type ServerQuery = t.TypeOf<typeof ServerQuery>;
export type SerializedServerQuery = t.OutputOf<typeof ServerQuery>;

export function serializeServerQuery(query: ServerQuery): SerializedServerQuery {
  return ServerQuery.encode(query);
}

export const deserializeServerQuery = deserializer(ServerQuery);
