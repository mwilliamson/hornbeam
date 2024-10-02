import { Instant } from "@js-joda/core";

export interface Comment {
  cardId: string;
  createdAt: Instant;
  id: string;
  text: string;
}

export interface CommentAddMutation {
  cardId: string;
  projectId: string,
  text: string;
}

export interface CommentAddEffect extends CommentAddMutation {
  createdAt: Instant;
  id: string;
}

export function createComment(request: CommentAddEffect): Comment {
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
