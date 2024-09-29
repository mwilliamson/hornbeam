import { Instant } from "@js-joda/core";
import { CardAddMutation, CardEditMutation } from "./cards";
import { AppMutation, ProjectContentsMutation, appMutations } from "./snapshots";
import { CategoryAddMutation } from "./categories";
import { CommentAddMutation } from "./comments";
import { testingCategoryAddMutation } from "./categories.testing";
import { testingCardAddMutation } from "./cards.testing";
import { ProjectAddMutation } from "./projects";
import { testingProjectAddMutation } from "./projects.testing";

const defaultCardEditId = "0191bea3-0002-7e56-a31e-999999999999";
const defaultCommentAddCardId = "0191bea4-0003-7e56-a31e-999999999999";
const defaultCommentAddId = "0191bea3-0004-7e56-a31e-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export const testingAppMutation = {
  cardAdd: (mutation: Partial<CardAddMutation>): ProjectContentsMutation => {
    return appMutations.cardAdd(testingCardAddMutation(mutation));
  },

  cardEdit: (mutation: Partial<CardEditMutation>): ProjectContentsMutation => {
    return appMutations.cardEdit({
      createdAt: defaultCreatedAt,
      id: defaultCardEditId,
      ...mutation,
    });
  },

  categoryAdd: (mutation: Partial<CategoryAddMutation>): ProjectContentsMutation => {
    return appMutations.categoryAdd(testingCategoryAddMutation(mutation));
  },

  commentAdd: (mutation: Partial<CommentAddMutation>): ProjectContentsMutation => {
    return appMutations.commentAdd({
      cardId: defaultCommentAddCardId,
      createdAt: defaultCreatedAt,
      id: defaultCommentAddId,
      text: "<default test text>",
      ...mutation,
    });
  },

  projectAdd: (mutation: Partial<ProjectAddMutation>): AppMutation => {
    return appMutations.projectAdd(testingProjectAddMutation(mutation));
  },
};
