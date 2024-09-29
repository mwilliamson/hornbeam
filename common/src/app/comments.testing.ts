import { Instant } from "@js-joda/core";
import { CommentAddMutation } from "./comments";

const defaultCommentAddCardId = "01921907-0001-7631-baa3-999999999999";
const defaultCommentAddId = "01921907-0002-7631-baa3-999999999999";
const defaultCommentAddProjectId = "01921907-0003-7631-baa3-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1726996734);

export function testingCommentAddMutation(mutation: Partial<CommentAddMutation>): CommentAddMutation {
  return {
    cardId: defaultCommentAddCardId,
    createdAt: defaultCreatedAt,
    id: defaultCommentAddId,
    projectId: defaultCommentAddProjectId,
    text: "<default test text>",
    ...mutation,
  };
}
