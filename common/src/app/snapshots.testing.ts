import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";
import { CardAddMutation, CardEditMutation } from "./cards";
import { ProjectContentsMutation, projectContentsMutations } from "./snapshots";
import { CategoryAddMutation } from "./categories";
import { presetColorWhite } from "./colors";
import { CommentAddMutation } from "./comments";

const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export const testProjectContentsMutation = {
  cardAdd: (mutation: Partial<CardAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.cardAdd({
      categoryId: uuidv7(),
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      parentCardId: null,
      text: "<default test text>",
      ...mutation,
    });
  },

  cardEdit: (mutation: Partial<CardEditMutation>): ProjectContentsMutation => {
    return projectContentsMutations.cardEdit({
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      ...mutation,
    });
  },

  categoryAdd: (mutation: Partial<CategoryAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.categoryAdd({
      color: {presetColorId: presetColorWhite.id},
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      name: "<default test name>",
      ...mutation,
    });
  },

  commentAdd: (mutation: Partial<CommentAddMutation>): ProjectContentsMutation => {
    return projectContentsMutations.commentAdd({
      cardId: uuidv7(),
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      text: "<default test text>",
      ...mutation,
    });
  },
};
