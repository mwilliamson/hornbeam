import { CardAddEffect, CardAddMutation, CardEditEffect, CardEditMutation } from "./cards";
import { AppEffect, AppMutation, ProjectContentsEffect, ProjectContentsMutation, appEffects, appMutations } from "./snapshots";
import { CategoryAddEffect, CategoryAddMutation } from "./categories";
import { CommentAddEffect, CommentAddMutation } from "./comments";
import { testingCategoryAddEffect } from "./categories.testing";
import { testingCardAddEffect, testingCardAddMutation, testingCardEditEffect, testingCardEditMutation } from "./cards.testing";
import { ProjectAddEffect, ProjectAddMutation } from "./projects";
import { testingProjectAddEffect, testingProjectAddMutation } from "./projects.testing";
import { testingCommentAddEffect, testingCommentAddMutation } from "./comments.testing";

export const testingAppEffect = {
  cardAdd: (effect: Partial<CardAddEffect>): ProjectContentsEffect => {
    return appEffects.cardAdd(testingCardAddEffect(effect));
  },

  cardEdit: (effect: Partial<CardEditEffect>): ProjectContentsEffect => {
    return appEffects.cardEdit(testingCardEditEffect(effect));
  },

  categoryAdd: (effect: Partial<CategoryAddEffect>): ProjectContentsEffect => {
    return appEffects.categoryAdd(testingCategoryAddEffect(effect));
  },

  commentAdd: (effect: Partial<CommentAddEffect>): ProjectContentsEffect => {
    return appEffects.commentAdd(testingCommentAddEffect(effect));
  },

  projectAdd: (effect: Partial<ProjectAddEffect>): AppEffect => {
    return appEffects.projectAdd(testingProjectAddEffect(effect));
  },
};

export const testingAppMutation = {
  cardAdd: (mutation: Partial<CardAddMutation>): ProjectContentsMutation<CardAddEffect> => {
    return appMutations.cardAdd(testingCardAddMutation(mutation));
  },

  cardEdit: (mutation: Partial<CardEditMutation>): ProjectContentsMutation<CardEditEffect> => {
    return appMutations.cardEdit(testingCardEditMutation(mutation));
  },

  categoryAdd: (mutation: Partial<CategoryAddMutation>): ProjectContentsMutation<CategoryAddEffect> => {
    return appMutations.categoryAdd(testingCategoryAddEffect(mutation));
  },

  commentAdd: (mutation: Partial<CommentAddMutation>): ProjectContentsMutation<CommentAddEffect> => {
    return appMutations.commentAdd(testingCommentAddMutation(mutation));
  },

  projectAdd: (mutation: Partial<ProjectAddMutation>): AppMutation<ProjectAddEffect> => {
    return appMutations.projectAdd(testingProjectAddMutation(mutation));
  },
};
