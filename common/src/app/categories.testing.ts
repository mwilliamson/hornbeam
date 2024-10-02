import { Instant } from "@js-joda/core";
import { CategoryAddEffect, CategoryAddMutation, CategoryReorderEffect, CategoryReorderMutation } from "./categories";
import { presetColorWhite } from "./colors";

const defaultCategoryAddId = "0191bea4-0000-7e56-a31e-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1724429942);
const defaultCategoryAddProjectId = "0191bea4-0000-7e56-a31e-999999999998";
const defaultCategoryReorderProjectId = "0191bea4-0000-7e56-a31e-999999999997";

export function testingCategoryAddMutation(mutation: Partial<CategoryAddMutation>): CategoryAddMutation {
  return {
    color: {presetColorId: presetColorWhite.id},
    name: "<default test name>",
    projectId: defaultCategoryAddProjectId,
    ...mutation,
  };
}

export function testingCategoryAddEffect(effect: Partial<CategoryAddEffect>): CategoryAddEffect {
  return {
    color: {presetColorId: presetColorWhite.id},
    createdAt: defaultCreatedAt,
    id: defaultCategoryAddId,
    name: "<default test name>",
    projectId: defaultCategoryAddProjectId,
    ...effect,
  };
}

export function testingCategoryReorderMutation(mutation: Partial<CategoryReorderMutation>): CategoryReorderMutation {
  return {
    ids: [],
    projectId: defaultCategoryReorderProjectId,
    ...mutation,
  };
}

export function testingCategoryReorderEffect(effect: Partial<CategoryReorderEffect>): CategoryReorderEffect {
  return {
    createdAt: defaultCreatedAt,
    ids: [],
    projectId: defaultCategoryReorderProjectId,
    ...effect,
  };
}
