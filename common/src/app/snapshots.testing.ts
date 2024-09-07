import { Instant } from "@js-joda/core";
import { CardAddMutation, CardEditMutation } from "./cards";
import { ProjectContentsMutation, projectContentsMutations } from "./snapshots";
import { CategoryAddMutation } from "./categories";
import { CommentAddMutation } from "./comments";
import { testingCategoryAddMutation } from "./categories.testing";
import { testingCardAddMutation } from "./cards.testing";

const defaultCardEditId = "0191bea3-0002-7e56-a31e-999999999999";
const defaultCommentAddCardId = "0191bea4-0003-7e56-a31e-999999999999";
const defaultCommentAddId = "0191bea3-0004-7e56-a31e-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export const testingProjectContentsMutation = {
  cardAdd: (mutation: Partial<CardAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.cardAdd(testingCardAddMutation(mutation));
  },

  cardEdit: (mutation: Partial<CardEditMutation>): ProjectContentsMutation => {
    return projectContentsMutations.cardEdit({
      createdAt: defaultCreatedAt,
      id: defaultCardEditId,
      ...mutation,
    });
  },

  categoryAdd: (mutation: Partial<CategoryAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.categoryAdd(testingCategoryAddMutation(mutation));
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
