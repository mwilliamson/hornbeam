import { Instant } from "@js-joda/core";

import { generateId } from "../../app/ids";
import { requests } from "../../app/snapshots";
import { allColorsQuery, availableCategoriesQuery } from "../../backendConnections/queries";
import Boundary from "../Boundary";
import CardAddForm from "./CardAddForm";
import { CardFormInitialState, ValidCardFormValues } from "./CardForm";

interface CardAddFormBoundaryProps {
  initialValue: CardFormInitialState;
  onClose: () => void;
}

export default function CardAddFormBoundary(props: CardAddFormBoundaryProps) {
  const {initialValue, onClose} = props;

  return (
    <Boundary
      queries={{
        availableCategories: availableCategoriesQuery,
        allColors: allColorsQuery,
      }}
      render={({availableCategories, allColors}, sendRequest) => (
        <CardAddForm
          allColors={allColors}
          availableCategories={availableCategories}
          initialValue={initialValue}
          onCardAdd={async ({categoryId, parentCardId, text}: ValidCardFormValues) => {
            await sendRequest(requests.cardAdd({
              categoryId,
              createdAt: Instant.now(),
              id: generateId(),
              parentCardId,
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