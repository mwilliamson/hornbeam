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

export function cardQuery(
  {cardId, projectId}: {cardId: string, projectId: string},
): AppQuery<Card | null> {
  return {
    type: "card",
    proof,
    cardId,
    projectId,
  };
}

export function parentCardQuery(
  {cardId, projectId}: {cardId: string, projectId: string},
): AppQuery<Card | null> {
  return {
    type: "parentCard",
    proof,
    cardId,
    projectId,
  };
}

export function cardChildCountQuery(
  {cardId, projectId}: {cardId: string, projectId: string},
): AppQuery<number> {
  return {
    type: "cardChildCount",
    proof,
    cardId,
    projectId,
  };
}

export function cardHistoryQuery(
  {cardId, projectId}: {cardId: string, projectId: string},
): AppQuery<CardHistory> {
  return {
    type: "cardHistory",
    proof,
    cardId,
    projectId,
  };
}

export function searchCardsQuery(
  {projectId, searchTerm}: {projectId: string, searchTerm: string},
): AppQuery<ReadonlyArray<Card>> {
  return {
    type: "searchCards",
    proof,
    projectId,
    searchTerm,
  };
}

export function boardCardTreesQuery({
  cardStatuses,
  boardId,
  projectId,
}: {
  readonly cardStatuses: ReadonlySet<CardStatus>;
  readonly boardId: BoardId;
  readonly projectId: string;
}): AppQuery<ReadonlyArray<CardTree>> {
  return {
    type: "boardCardTrees",
    proof,
    cardStatuses,
    boardId,
    projectId,
  };
}

export function parentBoardQuery(
  {boardId, projectId}: {boardId: BoardId, projectId: string},
): AppQuery<BoardId> {
  return {
    type: "parentBoard",
    proof,
    boardId,
    projectId,
  };
}

export function allCategoriesQuery({projectId}: {projectId: string}): AppQuery<CategorySet> {
  return {
    type: "allCategories",
    proof,
    projectId,
  };
}

export function availableCategoriesQuery(
  {projectId}: {projectId: string},
): AppQuery<ReadonlyArray<Category>> {
  return {
    type: "availableCategories",
    proof,
    projectId,
  };
}

export function allColorsQuery(
  {projectId}: {projectId: string},
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
