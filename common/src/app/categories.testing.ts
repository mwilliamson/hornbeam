import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";
import { CategoryAddMutation } from "./categories";
import { presetColorWhite } from "./colors";

const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export function testCategoryAddMutation(request: Partial<CategoryAddMutation>): CategoryAddMutation {
  return {
    color: {presetColorId: presetColorWhite.id},
    createdAt: defaultCreatedAt,
    id: uuidv7(),
    name: "<default test name>",
    ...request,
  };
}
