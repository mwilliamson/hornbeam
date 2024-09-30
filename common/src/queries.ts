import { BoardId } from "./app/boards";
import { Card, CardHistory } from "./app/cards";
import { CardStatus } from "./app/cardStatuses";
import { CardTree } from "./app/cardTrees";
import { Category, CategorySet } from "./app/categories";
import { ColorSet } from "./app/colors";
import { Project } from "./app/projects";

interface Leibniz<A, B> {
  (a: A): B
}

function proof<T>(value: T): T {
  return value;
}

export type AppQuery<R> =
  // Cards
  | {
    readonly type: "card";
    readonly proof: Leibniz<Card | null, R>;
    readonly cardId: string;
    readonly projectId: string;
  }
  | {
    readonly type: "parentCard";
    readonly proof: Leibniz<Card | null, R>;
    readonly cardId: string;
    readonly projectId: string;
  }
  | {
    readonly type: "cardChildCount";
    readonly proof: Leibniz<number, R>;
    readonly cardId: string;
    readonly projectId: string;
  }
  | {
    readonly type: "cardHistory";
    readonly proof: Leibniz<CardHistory, R>;
    readonly cardId: string;
    readonly projectId: string;
  }
  | {
    readonly type: "searchCards";
    readonly proof: Leibniz<ReadonlyArray<Card>, R>;
    readonly projectId: string;
    readonly searchTerm: string;
  }
  | {
    readonly type: "boardCardTrees";
    readonly proof: Leibniz<ReadonlyArray<CardTree>, R>;
    readonly cardStatuses: ReadonlySet<CardStatus>;
    readonly boardId: BoardId;
    readonly projectId: string;
  }
  | {
    readonly type: "parentBoard";
    readonly proof: Leibniz<BoardId, R>;
    readonly boardId: BoardId;
    readonly projectId: string;
  }
  // Categories
  | {
    readonly type: "allCategories";
    readonly proof: Leibniz<CategorySet, R>;
    readonly projectId: string;
  }
  | {
    readonly type: "availableCategories";
    readonly proof: Leibniz<ReadonlyArray<Category>, R>;
    readonly projectId: string;
  }
  // Colors
  | {
    readonly type: "allColors";
    readonly proof: Leibniz<ColorSet, R>;
    readonly projectId: string;
  }
  // Projects
  | {
    readonly type: "allProjects";
    readonly proof: Leibniz<ReadonlyArray<Project>, R>;
  };

export interface CardQuery {
  readonly cardId: string;
  readonly projectId: string;
}

export function cardQuery(
  {cardId, projectId}: CardQuery,
): AppQuery<Card | null> {
  return {
    type: "card",
    proof,
    cardId,
    projectId,
  };
}

interface ParentCardQuery {
  readonly cardId: string;
  readonly projectId: string;
}

export function parentCardQuery(
  {cardId, projectId}: ParentCardQuery,
): AppQuery<Card | null> {
  return {
    type: "parentCard",
    proof,
    cardId,
    projectId,
  };
}

interface CardChildCountQuery {
  readonly cardId: string;
  readonly projectId: string;
}

export function cardChildCountQuery(
  {cardId, projectId}: CardChildCountQuery,
): AppQuery<number> {
  return {
    type: "cardChildCount",
    proof,
    cardId,
    projectId,
  };
}

export interface CardHistoryQuery {
  readonly cardId: string;
  readonly projectId: string;
}

export function cardHistoryQuery(
  {cardId, projectId}: CardHistoryQuery,
): AppQuery<CardHistory> {
  return {
    type: "cardHistory",
    proof,
    cardId,
    projectId,
  };
}

interface SearchCardsQuery {
  readonly projectId: string;
  readonly searchTerm: string;
}

export function searchCardsQuery(
  {projectId, searchTerm}: SearchCardsQuery,
): AppQuery<ReadonlyArray<Card>> {
  return {
    type: "searchCards",
    proof,
    projectId,
    searchTerm,
  };
}

interface BoardCardTreesQuery {
  readonly cardStatuses: ReadonlySet<CardStatus>;
  readonly boardId: BoardId;
  readonly projectId: string;
}

export function boardCardTreesQuery({
  cardStatuses,
  boardId,
  projectId,
}: BoardCardTreesQuery): AppQuery<ReadonlyArray<CardTree>> {
  return {
    type: "boardCardTrees",
    proof,
    cardStatuses,
    boardId,
    projectId,
  };
}

interface ParentBoardQuery {
  readonly boardId: BoardId;
  readonly projectId: string;
}

export function parentBoardQuery(
  {boardId, projectId}: ParentBoardQuery,
): AppQuery<BoardId> {
  return {
    type: "parentBoard",
    proof,
    boardId,
    projectId,
  };
}

interface AllCategoriesQuery {
  readonly projectId: string;
}

export function allCategoriesQuery({projectId}: AllCategoriesQuery): AppQuery<CategorySet> {
  return {
    type: "allCategories",
    proof,
    projectId,
  };
}

interface AvailableCategoriesQuery {
  readonly projectId: string;
}

export function availableCategoriesQuery(
  {projectId}: AvailableCategoriesQuery,
): AppQuery<ReadonlyArray<Category>> {
  return {
    type: "availableCategories",
    proof,
    projectId,
  };
}

interface AllColorsQuery {
  readonly projectId: string;
}

export function allColorsQuery(
  {projectId}: AllColorsQuery,
): AppQuery<ColorSet>{
  return {
    type: "allColors",
    proof,
    projectId,
  };
}

export const allProjectsQuery: AppQuery<ReadonlyArray<Project>> = {
  type: "allProjects",
  proof,
};

export type AppQueries = {[k: string]: AppQuery<unknown> | null};
export type AppQueryResult<Q extends AppQuery<unknown> | null> = Q extends null ? null : Q extends AppQuery<infer R> ? R : never;
export type AppQueriesResult<TQueries extends AppQueries> = {[K in keyof TQueries]: AppQueryResult<TQueries[K]>};
