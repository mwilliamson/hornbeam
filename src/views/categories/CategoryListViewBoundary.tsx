import { Instant } from "@js-joda/core";

import { AppSnapshot, requests } from "../../app/snapshots";
import CategoryListView from "./CategoryListView";
import Boundary from "../Boundary";

interface CategoryListViewBoundaryProps {
  appSnapshot: AppSnapshot;
}

export default function CategoryListViewBoundary(props: CategoryListViewBoundaryProps) {
  const {appSnapshot} = props;

  return (
    <Boundary
      render={(sendRequest) => (
        <CategoryListView
          categories={appSnapshot.allCategories()}
          allColors={appSnapshot}
          onReorder={async ids => await sendRequest(requests.categoryReorder({
            createdAt: Instant.now(),
            ids,
          }))}
        />
      )}
    />
  );
}
