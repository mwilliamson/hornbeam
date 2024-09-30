import { Instant } from "@js-joda/core";
import { ValidationResult } from "../util/validation";
import { CardStatus } from "./cardStatuses";
import { Comment, CommentSet } from "./comments";

export interface Card {
  categoryId: string;
  createdAt: Instant;
  id: string;
  isSubboardRoot: boolean;
  number: number;
  parentCardId: string | null;
  status: CardStatus;
  text: string;
}

export type CardEvent =
  | {type: "created", instant: Instant}
  | {type: "comment", instant: Instant, comment: Comment};

export type CardHistory = ReadonlyArray<CardEvent>;

export function generateCardHistory(card: Card, appSnapshot: CommentSet): CardHistory {
  return [
    {
      type: "created",
      instant: card.createdAt,
    },
    ...appSnapshot.findCommentsByCardId(card.id).map(comment => ({
      type: "comment" as const,
      instant: comment.createdAt,
      comment,
    }))
  ];
}

export interface CardAddMutation {
  categoryId: string;
  createdAt: Instant;
  id: string;
  parentCardId: string | null;
  projectId: string;
  text: string;
}

export function createCard(request: CardAddMutation, cardNumber: number): Card {
  return {
    categoryId: request.categoryId,
    createdAt: request.createdAt,
    id: request.id,
    isSubboardRoot: false,
    number: cardNumber,
    parentCardId: request.parentCardId,
    status: CardStatus.None,
    text: request.text,
  };
}

export interface CardEditMutation {
  categoryId?: string;
  createdAt: Instant;
  id: string;
  isSubboardRoot?: boolean;
  parentCardId?: string | null;
  projectId: string;
  status?: CardStatus;
  text?: string;
}

export function updateCard(card: Card, request: Omit<CardEditMutation, "createdAt" | "id">): Card {
  return {
    categoryId: request.categoryId === undefined ? card.categoryId : request.categoryId,
    createdAt: card.createdAt,
    id: card.id,
    isSubboardRoot: request.isSubboardRoot === undefined ? card.isSubboardRoot : request.isSubboardRoot,
    number: card.number,
    parentCardId: request.parentCardId === undefined ? card.parentCardId : request.parentCardId,
    status: request.status === undefined ? card.status : request.status,
    text: request.text === undefined ? card.text : request.text,
  };
}

export interface CardMoveMutation {
  createdAt: Instant;
  direction: "up" | "down";
  id: string;
  projectId: string;
}

export interface CardMoveToBeforeMutation {
  beforeCardId: string;
  createdAt: Instant;
  moveCardId: string;
  parentCardId: string | null;
  projectId: string;
}

export interface CardMoveToAfterMutation {
  afterCardId: string;
  createdAt: Instant;
  moveCardId: string;
  parentCardId: string | null;
  projectId: string;
}

export function validateCardText(elementId: string, text: string): ValidationResult<string> {
  if (text === "") {
    return ValidationResult.invalid([
      {
        elementId,
        inlineText: "Enter the card text.",
        summaryText: "Card is missing text."
      },
    ]);
  } else {
    return ValidationResult.valid(text);
  }
}

export function validateCardCategory(elementId: string, categoryId: string | null): ValidationResult<string> {
  if (categoryId === null) {
    return ValidationResult.invalid([
      {
        elementId: elementId,
        inlineText: "Select a category.",
        summaryText: "Card is missing a category.",
      },
    ]);
  } else {
    return ValidationResult.valid(categoryId);
  }
}

export interface CardSet {
  allCards: () => ReadonlyArray<Card>;
  countCardChildren: (cardId: string) => number;
  findCardById: (cardId: string) => Card | null;
}

export interface CardSearcher {
  searchCards: (query: string) => Promise<ReadonlyArray<Card>>;
}
