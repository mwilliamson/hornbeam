import { Instant } from "@js-joda/core";
import { CommentAddMutation } from "./comments";

const defaultCommentAddCardId = "01921907-1e02-7631-baa3-ab811448f239";
const defaultCommentAddId = "01921907-1e02-7631-baa3-ab811448f239";
const defaultCreatedAt = Instant.ofEpochSecond(1726996734);

export function testingCommentAddMutation(mutation: Partial<CommentAddMutation>): CommentAddMutation {
  return {
    cardId: defaultCommentAddCardId,
    createdAt: defaultCreatedAt,
    id: defaultCommentAddId,
    text: "<default test text>",
    ...mutation,
  };
}
