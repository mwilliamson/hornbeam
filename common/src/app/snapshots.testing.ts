import { Instant } from "@js-joda/core";
import { CardAddMutation, CardEditMutation } from "./cards";
import { ProjectContentsMutation, projectContentsMutations } from "./snapshots";
import { CategoryAddMutation } from "./categories";
import { CommentAddMutation } from "./comments";
import { testCategoryAddMutation } from "./categories.testing";

const defaultCardAddCategoryId = "0191bea3-0000-7e56-a31e-999999999999";
const defaultCardAddId = "0191bea3-0001-7e56-a31e-999999999999";
const defaultCardEditId = "0191bea3-0002-7e56-a31e-999999999999";
const defaultCommentAddCardId = "0191bea4-0003-7e56-a31e-999999999999";
const defaultCommentAddId = "0191bea3-0004-7e56-a31e-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export const testProjectContentsMutation = {
  cardAdd: (mutation: Partial<CardAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.cardAdd({
      categoryId: defaultCardAddCategoryId,
      createdAt: defaultCreatedAt,
      id: defaultCardAddId,
      parentCardId: null,
      text: "<default test text>",
      ...mutation,
    });
  },

  cardEdit: (mutation: Partial<CardEditMutation>): ProjectContentsMutation => {
    return projectContentsMutations.cardEdit({
      createdAt: defaultCreatedAt,
      id: defaultCardEditId,
      ...mutation,
    });
  },

  categoryAdd: (mutation: Partial<CategoryAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.categoryAdd(testCategoryAddMutation(mutation));
  },

  commentAdd: (mutation: Partial<CommentAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.commentAdd({
      cardId: defaultCommentAddCardId,
      createdAt: defaultCreatedAt,
      id: defaultCommentAddId,
      text: "<default test text>",
      ...mutation,
    });
  },
};
