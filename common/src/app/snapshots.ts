import { Instant } from "@js-joda/core";
import { handleNever } from "../util/assertNever";
import { Card, CardAddRequest, CardEditRequest, CardMoveRequest, CardMoveToAfterRequest, CardMoveToBeforeRequest, CardSet, createCard, updateCard } from "./cards";
import { Category, CategoryAddRequest, CategoryReorderRequest, CategorySet, CategorySetInMemory } from "./categories";
import { ColorSet, colorSetPresetsOnly, PresetColor } from "./colors";
import { Comment, CommentAddRequest, CommentSet, createComment } from "./comments";

export class AppSnapshot implements CardSet, CategorySet, ColorSet, CommentSet {
  private readonly cards: ReadonlyArray<Card>;
  private readonly nextCardNumber: number;
  private readonly categories: CategorySetInMemory;
  private readonly colors: ColorSet;
  private readonly comments: ReadonlyArray<Comment>;

  public constructor(
    cards: ReadonlyArray<Card>,
    nextCardNumber: number,
    categories: CategorySetInMemory,
    colors: ColorSet,
    comments: ReadonlyArray<Comment>,
  ) {
    this.cards = cards;
    this.nextCardNumber = nextCardNumber;
    this.categories = categories;
    this.colors = colors;
    this.comments = comments;
  }

  public cardAdd(request: CardAddRequest): AppSnapshot {
    const card = createCard(request, this.nextCardNumber);
    return new AppSnapshot(
      [...this.cards, card],
      this.nextCardNumber + 1,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public cardEdit(request: CardEditRequest): AppSnapshot {
    return new AppSnapshot(
      this.cards.map(card => {
        if (card.id !== request.id) {
          return card;
        }

        return updateCard(card, request);
      }),
      this.nextCardNumber,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public cardMove(request: CardMoveRequest): AppSnapshot {
    const card = this.findCardById(request.id);

    if (card === null) {
      return this;
    }

    const siblingCards = this.cards
      .filter(otherCard => otherCard.parentCardId === card.parentCardId);

    const siblingIndex = siblingCards.findIndex(siblingCard => siblingCard.id === card.id);

    let swapWithCard: Card;

    switch (request.direction) {
      case "up":
        if (siblingIndex === 0) {
          return this;
        }
        swapWithCard = siblingCards[siblingIndex - 1];
        break;
      case "down":
        if (siblingIndex === siblingCards.length - 1) {
          return this;
        }
        swapWithCard = siblingCards[siblingIndex + 1];
        break;
      default:
        return handleNever(request.direction, this);
    }

    return new AppSnapshot(
      this.cards.map(otherCard => {
        if (otherCard.id === card.id) {
          return swapWithCard;
        } else if (otherCard.id === swapWithCard.id) {
          return card;
        } else {
          return otherCard;
        }
      }),
      this.nextCardNumber,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public cardMoveToAfter(request: CardMoveToAfterRequest): AppSnapshot {
    if (request.afterCardId === request.moveCardId) {
      return this;
    }

    const afterCard = this.cards.find(card => card.id === request.afterCardId);
    if (afterCard === undefined) {
      return this;
    }

    const movedCard = this.cards.find(card => card.id === request.moveCardId);
    if (movedCard === undefined) {
      return this;
    }

    return new AppSnapshot(
      this.cards.flatMap(card => {
        if (card.id === request.moveCardId) {
          return [];
        } else if (card.id === request.afterCardId) {
          return [
            card,
            updateCard(movedCard, {parentCardId: request.parentCardId}),
          ];
        } else {
          return [card];
        }
      }),
      this.nextCardNumber,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public cardMoveToBefore(request: CardMoveToBeforeRequest): AppSnapshot {
    if (request.beforeCardId === request.moveCardId) {
      return this;
    }

    const beforeCard = this.cards.find(card => card.id === request.beforeCardId);
    if (beforeCard === undefined) {
      return this;
    }

    const movedCard = this.cards.find(card => card.id === request.moveCardId);
    if (movedCard === undefined) {
      return this;
    }

    return new AppSnapshot(
      this.cards.flatMap(card => {
        if (card.id === request.moveCardId) {
          return [];
        } else if (card.id === request.beforeCardId) {
          return [
            updateCard(movedCard, {parentCardId: request.parentCardId}),
            card,
          ];
        } else {
          return [card];
        }
      }),
      this.nextCardNumber,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public allCards(): ReadonlyArray<Card> {
    return this.cards;
  }

  public countCardChildren(cardId: string): number {
    return this.cards.filter(card => card.parentCardId === cardId).length;
  }

  public findCardById(cardId: string): Card | null {
    return this.cards.find(card => card.id == cardId) ?? null;
  }

  public searchCards(query: string): ReadonlyArray<Card> {
    query = query.toLowerCase();

    return this.cards.filter(card => {
      // TODO: include numbers
      // TODO: prefer shorter matches
      // TODO: prefer match at start of text
      // TODO: normalise text
      // TODO: tokenize
      return card.text.toLowerCase().includes(query);
    });
  }

  public findCategoryById(categoryId: string): Category | null {
    return this.allCategories().find(category => category.id == categoryId) ?? null;
  }

  public categoryAdd(request: CategoryAddRequest): AppSnapshot {
    return new AppSnapshot(
      this.cards,
      this.nextCardNumber,
      this.categories.categoryAdd(request),
      this.colors,
      this.comments,
    );
  }

  public categoryReorder(request: CategoryReorderRequest): AppSnapshot {
    return new AppSnapshot(
      this.cards,
      this.nextCardNumber,
      this.categories.categoryReorder(request),
      this.colors,
      this.comments,
    );
  }

  public availableCategories(): ReadonlyArray<Category> {
    return this.categories.availableCategories();
  }

  public allCategories(): ReadonlyArray<Category> {
    return this.categories.allCategories();
  }

  public allPresetColors(): ReadonlyArray<PresetColor> {
    return this.colors.allPresetColors();
  }

  public findPresetColorById(presetColorId: string): PresetColor | null {
    return this.colors.findPresetColorById(presetColorId);
  }

  public commentAdd(request: CommentAddRequest): AppSnapshot {
    const comment = createComment(request);
    return new AppSnapshot(
      this.cards,
      this.nextCardNumber,
      this.categories,
      this.colors,
      [...this.comments, comment],
    );
  }

  public findCommentsByCardId(cardId: string): ReadonlyArray<Comment> {
    return this.comments.filter(comment => comment.cardId === cardId);
  }
}

export function initialAppSnapshot(): AppSnapshot {
  return new AppSnapshot(
    [],
    1,
    new CategorySetInMemory([]),
    colorSetPresetsOnly,
    [],
  );
}

export interface AppUpdate {
  updateId: string;
  request: AppRequest;
}

export type AppRequest =
  | {type: "cardAdd", cardAdd: CardAddRequest}
  | {type: "cardEdit", cardEdit: CardEditRequest}
  | {type: "cardMove", cardMove: CardMoveRequest}
  | {type: "cardMoveToAfter", cardMoveToAfter: CardMoveToAfterRequest}
  | {type: "cardMoveToBefore", cardMoveToBefore: CardMoveToBeforeRequest}
  | {type: "categoryAdd", categoryAdd: CategoryAddRequest}
  | {type: "categoryReorder", categoryReorder: CategoryReorderRequest}
  | {type: "commentAdd", commentAdd: CommentAddRequest};

export const requests = {
  cardAdd(request: CardAddRequest): AppRequest {
    return {type: "cardAdd", cardAdd: request};
  },

  cardEdit(request: CardEditRequest): AppRequest {
    return {type: "cardEdit", cardEdit: request};
  },

  cardMove(request: CardMoveRequest): AppRequest {
    return {type: "cardMove", cardMove: request};
  },

  cardMoveToAfter(request: CardMoveToAfterRequest): AppRequest {
    return {type: "cardMoveToAfter", cardMoveToAfter: request};
  },

  cardMoveToBefore(request: CardMoveToBeforeRequest): AppRequest {
    return {type: "cardMoveToBefore", cardMoveToBefore: request};
  },

  categoryAdd(request: CategoryAddRequest): AppRequest {
    return {type: "categoryAdd", categoryAdd: request};
  },

  categoryReorder(request: CategoryReorderRequest): AppRequest {
    return {type: "categoryReorder", categoryReorder: request};
  },

  commentAdd(request: CommentAddRequest): AppRequest {
    return {type: "commentAdd", commentAdd: request};
  },
};

export function requestCreatedAt(request: AppRequest): Instant {
  switch (request.type) {
    case "cardAdd":
      return request.cardAdd.createdAt;
    case "cardEdit":
      return request.cardEdit.createdAt;
    case "cardMove":
      return request.cardMove.createdAt;
    case "cardMoveToAfter":
      return request.cardMoveToAfter.createdAt;
    case "cardMoveToBefore":
      return request.cardMoveToBefore.createdAt;
    case "categoryAdd":
      return request.categoryAdd.createdAt;
    case "categoryReorder":
      return request.categoryReorder.createdAt;
    case "commentAdd":
      return request.commentAdd.createdAt;
    default:
      return handleNever(request, Instant.now());
  }
}

export function applySnapshotUpdate(snapshot: AppSnapshot, update: AppUpdate): AppSnapshot {
  switch (update.request.type) {
    case "cardAdd":
      return snapshot.cardAdd(update.request.cardAdd);
    case "cardEdit":
      return snapshot.cardEdit(update.request.cardEdit);
    case "cardMove":
      return snapshot.cardMove(update.request.cardMove);
    case "cardMoveToAfter":
      return snapshot.cardMoveToAfter(update.request.cardMoveToAfter);
    case "cardMoveToBefore":
      return snapshot.cardMoveToBefore(update.request.cardMoveToBefore);
    case "categoryAdd":
      return snapshot.categoryAdd(update.request.categoryAdd);
    case "categoryReorder":
      return snapshot.categoryReorder(update.request.categoryReorder);
    case "commentAdd":
      return snapshot.commentAdd(update.request.commentAdd);
    default:
      return handleNever(update.request, snapshot);
  }
}
