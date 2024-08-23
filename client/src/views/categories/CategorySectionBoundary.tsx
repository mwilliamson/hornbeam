import { Instant } from "@js-joda/core";

import { CategoryAddRequest } from "hornbeam-common/lib/app/categories";
import { requests } from "hornbeam-common/lib/app/snapshots";
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
      render={({allCategories, allColors}, sendRequest) => (
        <CategorySection
          categories={allCategories.allCategories()}
          allColors={allColors}
          onReorder={async ids => await sendRequest(requests.categoryReorder({
            createdAt: Instant.now(),
            ids,
          }))}
          onCategoryAdd={async (request: CategoryAddRequest) => {
            await sendRequest(requests.categoryAdd(request));
          }}
        />
      )}
    />
  );
}
