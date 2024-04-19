import { Instant } from "@js-joda/core";
import { ValidationResult } from "../util/validation";
import { CardStatus } from "./cardStatuses";
import { Comment, CommentSet } from "./comments";

export interface Card {
  categoryId: string;
  createdAt: Instant;
  id: string;
  number: number;
  parentCardId: string | null;
  status: CardStatus | null;
  text: string;
}

export type CardEvent =
  | {type: "created", instant: Instant}
  | {type: "comment", instant: Instant, comment: Comment};

export function cardHistory(card: Card, appState: CommentSet): ReadonlyArray<CardEvent> {
  return [
    {
      type: "created",
      instant: card.createdAt,
    },
    ...appState.findCommentsByCardId(card.id).map(comment => ({
      type: "comment" as const,
      instant: comment.createdAt,
      comment,
    }))
  ];
}

export interface CardAddRequest {
  categoryId: string;
  createdAt: Instant;
  id: string;
  parentCardId: string | null;
  text: string;
}

export function createCard(request: CardAddRequest, cardNumber: number): Card {
  return {
    categoryId: request.categoryId,
    createdAt: request.createdAt,
    id: request.id,
    number: cardNumber,
    parentCardId: request.parentCardId,
    status: null,
    text: request.text,
  };
}

export interface CardEditRequest {
  categoryId?: string;
  id: string;
  parentCardId?: string | null;
  status?: CardStatus | null;
  text?: string;
}

export function updateCard(card: Card, request: CardEditRequest): Card {
  return {
    categoryId: request.categoryId === undefined ? card.categoryId : request.categoryId,
    createdAt: card.createdAt,
    id: card.id,
    number: card.number,
    parentCardId: request.parentCardId === undefined ? card.parentCardId : request.parentCardId,
    status: request.status === undefined ? card.status : request.status,
    text: request.text === undefined ? card.text : request.text,
  };
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
  countCardChildren: (cardId: string) => number;
  findCardById: (cardId: string) => Card | null;
}
