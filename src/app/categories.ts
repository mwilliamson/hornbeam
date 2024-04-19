import { ColorSet, PresetColor, presetColorWhite } from "./colors";

export interface Category {
  id: string;
  name: string;
  color: {presetColorId: string};
}

export const allCategories: ReadonlyArray<Category> = [
  {
    id: "018ec4b8-30c5-7c09-a519-4b460db76da5",
    name: "Goal",
    color: {presetColorId: "018ef5cd-f61c-7b36-bd3c-b129e09f19e6"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b499ba9020c",
    name: "User Task",
    color: {presetColorId: "018ef5cf-1695-7594-8585-3e2a3486b1d9"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b4a243ce8c3",
    name: "Detail",
    color: {presetColorId: "018ef5cf-3c4a-7003-bc9e-3779b7bfd8d4"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b486f2cb5c2",
    name: "Question",
    color: {presetColorId: "018ef5cf-69f6-70bd-b00c-383b7ba25078"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b47c6a3cb5c",
    name: "Risk",
    color: {presetColorId: "018ef5cf-8e55-766e-9fbe-2ec21b1b0d51"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b45f141679a",
    name: "Bug",
    color: {presetColorId: "018ef5cf-ae92-77c9-b38a-4c6fec834693"},
  },
];

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
