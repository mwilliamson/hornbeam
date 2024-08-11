import { Category, CategoryAddRequest } from "hornbeam-common/src/app/categories";
import { ColorSet } from "hornbeam-common/src/app/colors";
import AddCategorySection from "./AddCategorySection";
import CategoryListView from "./CategoryListView";

interface CategorySectionProps {
  categories: ReadonlyArray<Category>;
  allColors: ColorSet;
  onCategoryAdd: (request: CategoryAddRequest) => Promise<void>;
  onReorder: (categoryIds: ReadonlyArray<string>) => Promise<void>;
}

export default function CategorySection(props: CategorySectionProps) {
  const {categories, allColors, onCategoryAdd, onReorder} = props;

  return (
    <>
      <CategoryListView
        categories={categories}
        allColors={allColors}
        onReorder={onReorder}
      />

      <AddCategorySection
        allColors={allColors}
        onCategoryAdd={onCategoryAdd}
      />
    </>
  );
}
