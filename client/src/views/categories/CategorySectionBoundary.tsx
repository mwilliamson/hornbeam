import { Instant } from "@js-joda/core";

import { CategoryAddMutation } from "hornbeam-common/lib/app/categories";
import { boardContentsMutations } from "hornbeam-common/lib/app/snapshots";
import Boundary from "../Boundary";
import { allCategoriesQuery, allColorsQuery } from "hornbeam-common/lib/queries";
import CategorySection from "./CategorySection";

export default function CategorySectionBoundary() {
  return (
    <Boundary
      queries={{
        allCategories: allCategoriesQuery,
        allColors: allColorsQuery,
      }}
      render={({allCategories, allColors}, sendMutation) => (
        <CategorySection
          categories={allCategories.allCategories()}
          allColors={allColors}
          onReorder={async ids => await sendMutation(boardContentsMutations.categoryReorder({
            createdAt: Instant.now(),
            ids,
          }))}
          onCategoryAdd={async (mutation: CategoryAddMutation) => {
            await sendMutation(boardContentsMutations.categoryAdd(mutation));
          }}
        />
      )}
    />
  );
}
