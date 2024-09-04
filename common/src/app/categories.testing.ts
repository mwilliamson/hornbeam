import { Instant } from "@js-joda/core";
import { CategoryAddMutation, CategoryReorderMutation } from "./categories";
import { presetColorWhite } from "./colors";

const defaultCategoryAddId = "0191bea4-0000-7e56-a31e-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export function testCategoryAddMutation(mutation: Partial<CategoryAddMutation>): CategoryAddMutation {
  return {
    color: {presetColorId: presetColorWhite.id},
    createdAt: defaultCreatedAt,
    id: defaultCategoryAddId,
    name: "<default test name>",
    ...mutation,
  };
}

export function testCategoryReorderMutation(mutation: Partial<CategoryReorderMutation>): CategoryReorderMutation {
  return {
    createdAt: defaultCreatedAt,
    ids: [],
    ...mutation,
  };
}
