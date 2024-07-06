import { Instant } from "@js-joda/core";

import { requests } from "../../app/snapshots";
import CategoryListView from "./CategoryListView";
import Boundary from "../Boundary";
import { allCategoriesQuery, allColorsQuery } from "../../backendConnections/queries";

export default function CategoryListViewBoundary() {
  return (
    <Boundary
      queries={{
        allCategories: allCategoriesQuery,
        allColors: allColorsQuery,
      }}
      render={({allCategories, allColors}, sendRequest) => (
        <CategoryListView
          categories={allCategories}
          allColors={allColors}
          onReorder={async ids => await sendRequest(requests.categoryReorder({
            createdAt: Instant.now(),
            ids,
          }))}
        />
      )}
    />
  );
}
