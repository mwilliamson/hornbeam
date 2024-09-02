import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";
import { CategoryAddMutation, CategoryReorderMutation } from "./categories";
import { presetColorWhite } from "./colors";

const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export function testCategoryAddMutation(mutation: Partial<CategoryAddMutation>): CategoryAddMutation {
  return {
    color: {presetColorId: presetColorWhite.id},
    createdAt: defaultCreatedAt,
    id: uuidv7(),
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
