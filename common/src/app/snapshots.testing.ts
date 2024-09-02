import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";
import { CardAddMutation, CardEditMutation } from "./cards";
import { BoardContentsMutation, boardContentsMutations } from "./snapshots";
import { CategoryAddMutation } from "./categories";
import { presetColorWhite } from "./colors";
import { CommentAddMutation } from "./comments";

const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export const testBoardContentsMutation = {
  cardAdd: (request: Partial<CardAddMutation>): BoardContentsMutation => {
    return boardContentsMutations.cardAdd({
      categoryId: uuidv7(),
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      parentCardId: null,
      text: "<default test text>",
      ...request,
    });
  },

  cardEdit: (request: Partial<CardEditMutation>): BoardContentsMutation => {
    return boardContentsMutations.cardEdit({
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      ...request,
    });
  },

  categoryAdd: (request: Partial<CategoryAddMutation>): BoardContentsMutation => {
    return boardContentsMutations.categoryAdd({
      color: {presetColorId: presetColorWhite.id},
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      name: "<default test name>",
      ...request,
    });
  },

  commentAdd: (request: Partial<CommentAddMutation>): BoardContentsMutation => {
    return boardContentsMutations.commentAdd({
      cardId: uuidv7(),
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      text: "<default test text>",
      ...request,
    });
  },
};
