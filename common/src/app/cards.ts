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
  parentCardId: string | null;
  projectId: string;
  text: string;
}

export interface CardAddEffect extends CardAddMutation {
  createdAt: Instant;
  id: string;
}

export function createCard(effect: CardAddEffect, cardNumber: number): Card {
  // TODO: store number on effect?
  return {
    categoryId: effect.categoryId,
    createdAt: effect.createdAt,
    id: effect.id,
    isSubboardRoot: false,
    number: cardNumber,
    parentCardId: effect.parentCardId,
    status: CardStatus.None,
    text: effect.text,
  };
}

export interface CardEditMutation {
  edits: CardEdits;
  id: string;
  projectId: string;
}

export interface CardEdits {
  categoryId?: string;
  isSubboardRoot?: boolean;
  parentCardId?: string | null;
  status?: CardStatus;
  text?: string;
}

export interface CardEditEffect extends CardEditMutation {
  createdAt: Instant;
}

export function updateCard(card: Card, edits: CardEdits): Card {
  return {
    categoryId: edits.categoryId === undefined ? card.categoryId : edits.categoryId,
    createdAt: card.createdAt,
    id: card.id,
    isSubboardRoot: edits.isSubboardRoot === undefined ? card.isSubboardRoot : edits.isSubboardRoot,
    number: card.number,
    parentCardId: edits.parentCardId === undefined ? card.parentCardId : edits.parentCardId,
    status: edits.status === undefined ? card.status : edits.status,
    text: edits.text === undefined ? card.text : edits.text,
  };
}

export interface CardMoveMutation {
  direction: "up" | "down";
  id: string;
  projectId: string;
}

export interface CardMoveEffect extends CardMoveMutation {
  createdAt: Instant;
}

export interface CardMoveToBeforeMutation {
  beforeCardId: string;
  moveCardId: string;
  parentCardId: string | null;
  projectId: string;
}

export interface CardMoveToBeforeEffect extends CardMoveToBeforeMutation {
  createdAt: Instant;
}

export interface CardMoveToAfterMutation {
  afterCardId: string;
  moveCardId: string;
  parentCardId: string | null;
  projectId: string;
}

export interface CardMoveToAfterEffect extends CardMoveToAfterMutation {
  createdAt: Instant;
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
