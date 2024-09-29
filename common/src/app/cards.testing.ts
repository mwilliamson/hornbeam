import { Instant } from "@js-joda/core";
import { CardAddMutation, CardEditMutation } from "./cards";

const defaultCardAddId = "0191beb2-0000-7ccf-a72c-999999999999";
const defaultCardAddCategoryId = "0191beb2-0001-7ccf-a72c-999999999999";
const defaultCardAddProjectId = "0191beb2-0002-7ccf-a72c-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export function testingCardAddMutation(mutation: Partial<CardAddMutation>): CardAddMutation {
  return {
    categoryId: defaultCardAddCategoryId,
    createdAt: defaultCreatedAt,
    id: defaultCardAddId,
    parentCardId: null,
    projectId: defaultCardAddProjectId,
    text: "<default test text>",
    ...mutation,
  };
}

export function testingCardEditMutation(mutation: Partial<CardEditMutation>): CardEditMutation {
  return {
    createdAt: defaultCreatedAt,
    id: defaultCardAddId,
    ...mutation,
  };
}
