import { Instant } from "@js-joda/core";

import { ColorRef, ColorSet, PresetColor, presetColorWhite } from "./colors";
import { reorder } from "../util/arrays";

export interface Category {
  id: string;
  name: string;
  color: ColorRef;
  projectId: string;
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

export interface CategoryAddMutation {
  color: ColorRef;
  name: string;
  projectId: string;
}

export interface CategoryAddEffect extends CategoryAddMutation {
  createdAt: Instant;
  id: string;
}

export function createCategory(effect: CategoryAddEffect): Category {
  return {
    color: effect.color,
    id: effect.id,
    name: effect.name,
    projectId: effect.projectId,
  };
}

export interface CategoryReorderMutation {
  ids: ReadonlyArray<string>;
  projectId: string;
}

export interface CategoryReorderEffect extends CategoryReorderMutation {
  createdAt: Instant;
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

  public categoryAdd(effect: CategoryAddEffect): CategorySetInMemory {
    const category = createCategory(effect);
    return new CategorySetInMemory([...this.categories, category]);
  }

  public categoryReorder(effect: CategoryReorderEffect): CategorySetInMemory {
    const newCategories = reorder(
      this.categories,
      category => category.id,
      effect.ids,
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
