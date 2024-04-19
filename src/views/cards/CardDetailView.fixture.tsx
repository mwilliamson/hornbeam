import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";

import { initialAppState } from "../../app";
import CardDetailView from "./CardDetailView";
import { Card } from "../../app/cards";

const appState = initialAppState();

const card: Card = {
  categoryId: appState.availableCategories()[1].id,
  createdAt: Instant.ofEpochMilli(1713386548306),
  id: uuidv7(),
  number: 42,
  parentCardId: null,
  status: null,
  text: "Show history in card detail view"
};

export default (
  <div style={{border: "1px solid black", width: 400, minHeight: 600}}>
    <CardDetailView
      allCards={appState}
      allCategories={appState}
      allColors={appState}
      card={card}
      onAddChildClick={() => {}}
      onCardCategorySave={() => Promise.resolve()}
      onCardTextSave={() => Promise.resolve()}
    />
  </div>
);
