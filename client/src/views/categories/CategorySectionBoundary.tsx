import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";

import { appMutations } from "hornbeam-common/lib/app/snapshots";
import Boundary from "../Boundary";
import { allCategoriesQuery, allColorsQuery } from "hornbeam-common/lib/queries";
import CategorySection from "./CategorySection";

interface CategorySectionBoundaryProps {
  projectId: string;
}

export default function CategorySectionBoundary(props: CategorySectionBoundaryProps) {
  const {projectId} = props;

  return (
    <Boundary
      queries={{
        allCategories: allCategoriesQuery({projectId}),
        allColors: allColorsQuery,
      }}
      render={({allCategories, allColors}, sendMutation) => (
        <CategorySection
          categories={allCategories.allCategories()}
          allColors={allColors}
          onReorder={async ids => await sendMutation(appMutations.categoryReorder({
            createdAt: Instant.now(),
            ids,
            projectId,
          }))}
          onCategoryAdd={async (mutation) => {
            await sendMutation(appMutations.categoryAdd({
              ...mutation,
              createdAt: Instant.now(),
              id: uuidv7(),
              projectId,
            }));
          }}
        />
      )}
    />
  );
}
