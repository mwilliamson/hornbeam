import { Instant } from "@js-joda/core";

import { initialProjectContentsSnapshot } from "hornbeam-common/lib/app/snapshots";
import { Card, generateCardHistory } from "hornbeam-common/lib/app/cards";
import { CardStatus } from "hornbeam-common/lib/app/cardStatuses";
import { rootBoardId } from "hornbeam-common/lib/app/boards";
import CardDetailView from "./CardDetailView";
import { testingCategoryAddEffect } from "hornbeam-common/lib/app/categories.testing";
import { generateId } from "hornbeam-common/lib/app/ids";

const snapshot = initialProjectContentsSnapshot()
  .categoryAdd(testingCategoryAddEffect({
    color: {presetColorId: "018ef5cd-f61c-7b36-bd3c-b129e09f19e6"},
    id: "018ec4b8-30c5-7c09-a519-4b460db76da5",
    name: "Goal",
  }))
  .categoryAdd(testingCategoryAddEffect({
    color: {presetColorId: "018ef5cf-1695-7594-8585-3e2a3486b1d9"},
    createdAt: Instant.ofEpochSecond(1713386548),
    name: "User Task",
  }))
  .categoryAdd(testingCategoryAddEffect({
    color: {presetColorId: "018ef5cf-3c4a-7003-bc9e-3779b7bfd8d4"},
    id: "018ec4b8-30c5-7c09-a519-4b4a243ce8c3",
    name: "Detail",
  }))
  .categoryAdd(testingCategoryAddEffect({
    color: {presetColorId: "018ef5cf-69f6-70bd-b00c-383b7ba25078"},
    id: "018ec4b8-30c5-7c09-a519-4b486f2cb5c2",
    name: "Question",
  }))
  .categoryAdd(testingCategoryAddEffect({
    color: {presetColorId: "018ef5cf-8e55-766e-9fbe-2ec21b1b0d51"},
    id: "018ec4b8-30c5-7c09-a519-4b47c6a3cb5c",
    name: "Risk",
  }))
  .categoryAdd(testingCategoryAddEffect({
    color: {presetColorId: "018ef5cf-ae92-77c9-b38a-4c6fec834693"},
    id: "018ec4b8-30c5-7c09-a519-4b45f141679a",
    name: "Bug",
  }));

const card: Card = {
  categoryId: snapshot.availableCategories()[1].id,
  createdAt: Instant.ofEpochMilli(1713386548306),
  id: generateId(),
  isSubboardRoot: false,
  number: 42,
  parentCardId: null,
  status: CardStatus.None,
  text: "Show history in card detail view"
};

export default (
  <div style={{border: "1px solid black", width: 400, minHeight: 600}}>
    <CardDetailView
      allCategories={snapshot}
      allColors={snapshot}
      card={card}
      cardChildCount={2}
      cardHistory={generateCardHistory(card, snapshot)}
      cardSearcher={{searchCards: async (query: string) => snapshot.searchCards(query)}}
      onAddChildClick={() => {}}
      onCardEdit={() => Promise.resolve()}
      onCardMove={() => Promise.resolve()}
      onCommentAdd={() => Promise.resolve()}
      onBoardOpen={() => {}}
      parentCard={null}
      selectedBoardId={rootBoardId}
    />
  </div>
);
