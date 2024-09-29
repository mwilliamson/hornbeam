import { Category, CategoryAddMutation } from "hornbeam-common/lib/app/categories";
import { ColorSet } from "hornbeam-common/lib/app/colors";
import AddCategorySection from "./AddCategorySection";
import CategoryListView from "./CategoryListView";

interface CategorySectionProps {
  categories: ReadonlyArray<Category>;
  allColors: ColorSet;
  projectId: string;
  onCategoryAdd: (mutation: CategoryAddMutation) => Promise<void>;
  onReorder: (categoryIds: ReadonlyArray<string>) => Promise<void>;
}

export default function CategorySection(props: CategorySectionProps) {
  const {categories, allColors, projectId, onCategoryAdd, onReorder} = props;

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
        projectId={projectId}
      />
    </>
  );
}
