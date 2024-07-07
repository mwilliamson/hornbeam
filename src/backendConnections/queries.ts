import { Category } from "../app/categories";
import { ColorSet } from "../app/colors";

interface Leibniz<A, B> {
  (a: A): B
}

export type AppQuery<R> =
  | {
    readonly type: "allCategories";
    readonly proof: Leibniz<ReadonlyArray<Category>, R>;
  }
  | {
    readonly type: "availableCategories";
    readonly proof: Leibniz<ReadonlyArray<Category>, R>;
  }
  | {
    readonly type: "allColors";
    readonly proof: Leibniz<ColorSet, R>;
  };

export const allCategoriesQuery: AppQuery<ReadonlyArray<Category>> = {
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
