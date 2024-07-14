import { Card, CardHistory, CardSearcher } from "../app/cards";
import { Category, CategorySet } from "../app/categories";
import { ColorSet } from "../app/colors";

interface Leibniz<A, B> {
  (a: A): B
}

export type AppQuery<R> =
  // Cards
  | {
    readonly type: "card";
    readonly proof: Leibniz<Card | null, R>;
    readonly cardId: string;
  }
  | {
    readonly type: "parentCard";
    readonly proof: Leibniz<Card | null, R>;
    readonly cardId: string;
  }
  | {
    readonly type: "cardChildCount";
    readonly proof: Leibniz<number, R>;
    readonly cardId: string;
  }
  | {
    readonly type: "cardHistory";
    readonly proof: Leibniz<CardHistory, R>;
    readonly cardId: string;
  }
  | {
    readonly type: "cardSearcher";
    readonly proof: Leibniz<CardSearcher, R>;
  }
  // Categories
  | {
    readonly type: "allCategories";
    readonly proof: Leibniz<CategorySet, R>;
  }
  | {
    readonly type: "availableCategories";
    readonly proof: Leibniz<ReadonlyArray<Category>, R>;
  }
  // Colors
  | {
    readonly type: "allColors";
    readonly proof: Leibniz<ColorSet, R>;
  };

export function cardQuery(cardId: string): AppQuery<Card | null> {
  return {
    type: "card",
    proof: x => x,
    cardId,
  };
}

export function parentCardQuery(cardId: string): AppQuery<Card | null> {
  return {
    type: "parentCard",
    proof: x => x,
    cardId,
  };
}

export function cardChildCountQuery(cardId: string): AppQuery<number> {
  return {
    type: "cardChildCount",
    proof: x => x,
    cardId,
  };
}

export function cardHistoryQuery(cardId: string): AppQuery<CardHistory> {
  return {
    type: "cardHistory",
    proof: x => x,
    cardId,
  };
}

export const cardSearcherQuery: AppQuery<CardSearcher> = {
  type: "cardSearcher",
  proof: x => x,
};

export const allCategoriesQuery: AppQuery<CategorySet> = {
  type: "allCategories",
  proof: x => x,
};

export const availableCategoriesQuery: AppQuery<ReadonlyArray<Category>> = {
  type: "availableCategories",
  proof: x => x,
};

export const allColorsQuery: AppQuery<ColorSet> = {
  type: "allColors",
  proof: x => x,
};

export type QueryResult<Q extends AppQuery<unknown>> = Q extends AppQuery<infer R> ? R : never;
