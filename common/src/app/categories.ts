import { Instant } from "@js-joda/core";

import { ColorRef, ColorSet, PresetColor, presetColorWhite } from "./colors";
import { reorder } from "../util/arrays";

export interface Category {
  id: string;
  name: string;
  color: ColorRef;
}

export function categoryBackgroundColorStyle(
  category: Category | null,
  allColors: ColorSet,
): React.CSSProperties {
  return categoryBackgroundColor(category, allColors).backgroundColorStyle();
}

export function categoryBackgroundColor(
  category: Category | null,
  allColors: ColorSet,
): PresetColor {
  if (category == null) {
    return presetColorWhite;
  }

  return allColors.findPresetColorById(category.color.presetColorId)
    ?? presetColorWhite;
}

export interface CategoryAddRequest {
  createdAt: Instant;
  color: ColorRef;
  id: string;
  name: string;
}

export function createCategory(request: CategoryAddRequest): Category {
  return {
    color: request.color,
    id: request.id,
    name: request.name,
  };
}

export interface CategoryReorderRequest {
  createdAt: Instant;
  ids: ReadonlyArray<string>;
}

export interface CategorySet {
  allCategories(): ReadonlyArray<Category>;
  availableCategories(): ReadonlyArray<Category>;
  findCategoryById: (categoryId: string) => Category | null;
}

export class CategorySetInMemory implements CategorySet {
  private readonly categories: ReadonlyArray<Category>;

  public constructor(categories: ReadonlyArray<Category>) {
    this.categories = categories;
  }

  public findCategoryById(categoryId: string): Category | null {
    return this.allCategories().find(category => category.id == categoryId) ?? null;
  }

  public categoryAdd(request: CategoryAddRequest): CategorySetInMemory {
    const category = createCategory(request);
    return new CategorySetInMemory([...this.categories, category]);
  }

  public categoryReorder(request: CategoryReorderRequest): CategorySetInMemory {
    const newCategories = reorder(
      this.categories,
      category => category.id,
      request.ids,
    );

    return new CategorySetInMemory(newCategories);
  }

  public availableCategories(): ReadonlyArray<Category> {
    return this.categories;
  }

  public allCategories(): ReadonlyArray<Category> {
    return this.categories;
  }
}
