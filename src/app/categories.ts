import { Instant } from "@js-joda/core";

import { ColorSet, PresetColor, presetColorWhite } from "./colors";

export interface Category {
  id: string;
  name: string;
  color: {presetColorId: string};
}

export interface CategoryAddRequest {
  createdAt: Instant;
  color: {presetColorId: string};
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

export function categoryBackgroundColorStyle(
  category: Category | null,
  allColors: ColorSet,
): React.CSSProperties {
  return categoryBackgroundColor(category, allColors).backgroundColorStyle();
}

function categoryBackgroundColor(
  category: Category | null,
  allColors: ColorSet,
): PresetColor {
  if (category == null) {
    return presetColorWhite;
  }

  return allColors.findPresetColorById(category.color.presetColorId)
    ?? presetColorWhite;
}

export interface CategorySet {
  availableCategories(): ReadonlyArray<Category>;
  findCategoryById: (categoryId: string) => Category | null;
}
