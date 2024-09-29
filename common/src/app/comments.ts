import { Instant } from "@js-joda/core";

export interface Comment {
  cardId: string;
  createdAt: Instant;
  id: string;
  text: string;
}

export interface CommentAddMutation {
  cardId: string;
  createdAt: Instant;
  id: string;
  projectId: string,
  text: string;
}

export function createComment(request: CommentAddMutation): Comment {
  return {
    cardId: request.cardId,
    createdAt: request.createdAt,
    id: request.id,
    text: request.text,
  };
}

export interface CommentSet {
  findCommentsByCardId: (cardId: string) => ReadonlyArray<Comment>;
}
