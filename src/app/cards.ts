import { Instant } from "@js-joda/core";
import { ValidationResult } from "../util/validation";

export interface Card {
  categoryId: string;
  createdAt: Instant;
  id: string;
  number: number;
  parentCardId: string | null;
  text: string;
}

export type CardEvent =
  | {type: "created", instant: Instant};

export function cardHistory(card: Card): ReadonlyArray<CardEvent> {
  return [
    {
      type: "created",
      instant: card.createdAt,
    }
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
    text: request.text,
  };
}

export interface CardDeleteRequest {
  id: string;
}

export interface CardEditRequest {
  categoryId?: string;
  id: string;
  parentCardId?: string | null;
  text?: string;
}

export function updateCard(card: Card, request: CardEditRequest): Card {
  return {
    categoryId: request.categoryId === undefined ? card.categoryId : request.categoryId,
    createdAt: card.createdAt,
    id: card.id,
    number: card.number,
    parentCardId: request.parentCardId === undefined ? card.parentCardId : request.parentCardId,
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
  findCardById: (cardId: string) => Card | null;
}
