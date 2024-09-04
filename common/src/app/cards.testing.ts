import { Instant } from "@js-joda/core";
import { CardAddMutation } from "./cards";

const defaultCardAddId = "0191beb2-0000-7ccf-a72c-999999999999";
const defaultCardAddCategoryId = "0191beb2-0001-7ccf-a72c-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export function testCardAddMutation(mutation: Partial<CardAddMutation>): CardAddMutation {
  return {
    categoryId: defaultCardAddCategoryId,
    createdAt: defaultCreatedAt,
    id: defaultCardAddId,
    parentCardId: null,
    text: "<default test text>",
    ...mutation,
  };
}
