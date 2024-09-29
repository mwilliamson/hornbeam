import { CardAddMutation, CardEditMutation } from "./cards";
import { AppMutation, ProjectContentsMutation, appMutations } from "./snapshots";
import { CategoryAddMutation } from "./categories";
import { CommentAddMutation } from "./comments";
import { testingCategoryAddMutation } from "./categories.testing";
import { testingCardAddMutation, testingCardEditMutation } from "./cards.testing";
import { ProjectAddMutation } from "./projects";
import { testingProjectAddMutation } from "./projects.testing";
import { testingCommentAddMutation } from "./comments.testing";

export const testingAppMutation = {
  cardAdd: (mutation: Partial<CardAddMutation>): ProjectContentsMutation => {
    return appMutations.cardAdd(testingCardAddMutation(mutation));
  },

  cardEdit: (mutation: Partial<CardEditMutation>): ProjectContentsMutation => {
    return appMutations.cardEdit(testingCardEditMutation(mutation));
  },

  categoryAdd: (mutation: Partial<CategoryAddMutation>): ProjectContentsMutation => {
    return appMutations.categoryAdd(testingCategoryAddMutation(mutation));
  },

  commentAdd: (mutation: Partial<CommentAddMutation>): ProjectContentsMutation => {
    return appMutations.commentAdd(testingCommentAddMutation(mutation));
  },

  projectAdd: (mutation: Partial<ProjectAddMutation>): AppMutation => {
    return appMutations.projectAdd(testingProjectAddMutation(mutation));
  },
};
