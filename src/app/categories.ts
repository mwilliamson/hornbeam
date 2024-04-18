import { Color } from "./colors";

export interface Category {
  id: string;
  name: string;
  color: Color;
}

export const allCategories: ReadonlyArray<Category> = [
  {
    id: "018ec4b8-30c5-7c09-a519-4b460db76da5",
    name: "Goal",
    color: {hex: "#adf7b6"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b499ba9020c",
    name: "User Task",
    color: {hex: "#ffee93"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b4a243ce8c3",
    name: "Detail",
    color: {hex: "#a0ced9"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b486f2cb5c2",
    name: "Question",
    color: {hex: "#e6aeff"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b47c6a3cb5c",
    name: "Risk",
    color: {hex: "#ffc09f"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b45f141679a",
    name: "Bug",
    color: {hex: "#ffacbb"},
  },
];

export interface CategorySet {
  availableCategories(): ReadonlyArray<Category>;
  findCategoryById: (categoryId: string) => Category | null;
}
