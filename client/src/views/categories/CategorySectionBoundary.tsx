import { Instant } from "@js-joda/core";

import { CategoryAddRequest } from "../../app/categories";
import { requests } from "../../app/snapshots";
import Boundary from "../Boundary";
import { allCategoriesQuery, allColorsQuery } from "../../backendConnections/queries";
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
