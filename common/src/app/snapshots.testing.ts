import { Instant } from "@js-joda/core";
import { CardAddMutation, CardEditMutation } from "./cards";
import { ProjectContentsMutation, projectContentsMutations } from "./snapshots";
import { CategoryAddMutation } from "./categories";
import { CommentAddMutation } from "./comments";
import { testCategoryAddMutation } from "./categories.testing";

const defaultId = "0191bea3-4895-7e56-a31e-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export const testProjectContentsMutation = {
  cardAdd: (mutation: Partial<CardAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.cardAdd({
      categoryId: defaultId,
      createdAt: defaultCreatedAt,
      id: defaultId,
      parentCardId: null,
      text: "<default test text>",
      ...mutation,
    });
  },

  cardEdit: (mutation: Partial<CardEditMutation>): ProjectContentsMutation => {
    return projectContentsMutations.cardEdit({
      createdAt: defaultCreatedAt,
      id: defaultId,
      ...mutation,
    });
  },

  categoryAdd: (mutation: Partial<CategoryAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.categoryAdd(testCategoryAddMutation(mutation));
  },

  commentAdd: (mutation: Partial<CommentAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.commentAdd({
      cardId: defaultId,
      createdAt: defaultCreatedAt,
      id: defaultId,
      text: "<default test text>",
      ...mutation,
    });
  },
};
