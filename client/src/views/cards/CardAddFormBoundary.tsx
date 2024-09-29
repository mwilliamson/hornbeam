import { Instant } from "@js-joda/core";

import { generateId } from "hornbeam-common/lib/app/ids";
import { appMutations } from "hornbeam-common/lib/app/snapshots";
import { allColorsQuery, availableCategoriesQuery } from "hornbeam-common/lib/queries";
import Boundary from "../Boundary";
import CardAddForm from "./CardAddForm";
import { CardFormInitialState, ValidCardFormValues } from "./CardForm";

interface CardAddFormBoundaryProps {
  initialValue: CardFormInitialState;
  onClose: () => void;
  projectId: string;
}

export default function CardAddFormBoundary(props: CardAddFormBoundaryProps) {
  const {initialValue, onClose, projectId} = props;

  return (
    <Boundary
      queries={{
        availableCategories: availableCategoriesQuery({projectId}),
        allColors: allColorsQuery({projectId}),
      }}
      render={({availableCategories, allColors}, mutate) => (
        <CardAddForm
          allColors={allColors}
          availableCategories={availableCategories}
          initialValue={initialValue}
          onCardAdd={async ({categoryId, parentCardId, text}: ValidCardFormValues) => {
            await mutate(appMutations.cardAdd({
              categoryId,
              createdAt: Instant.now(),
              id: generateId(),
              parentCardId,
              projectId,
              text,
            }));
            onClose();
          }}
          onClose={onClose}
        />
      )}
    />
  );
}
