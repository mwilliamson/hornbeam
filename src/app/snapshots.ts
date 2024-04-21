import { Instant } from "@js-joda/core";
import assertNever from "../util/assertNever";
import { Card, CardAddRequest, CardEditRequest, CardSet, createCard, updateCard } from "./cards";
import { Category, CategoryAddRequest, CategoryReorderRequest, CategorySet, createCategory } from "./categories";
import { ColorSet, PresetColor, presetColors } from "./colors";
import { Comment, CommentAddRequest, CommentSet, createComment } from "./comments";
import { reorder } from "../util/arrays";

export class AppSnapshot implements CardSet, CategorySet, ColorSet, CommentSet {
  public readonly cards: ReadonlyArray<Card>;
  private readonly nextCardNumber: number;
  private readonly categories: ReadonlyArray<Category>;
  private readonly comments: ReadonlyArray<Comment>;

  public constructor(
    cards: ReadonlyArray<Card>,
    nextCardNumber: number,
    categories: ReadonlyArray<Category>,
    comments: ReadonlyArray<Comment>,
  ) {
    this.cards = cards;
    this.nextCardNumber = nextCardNumber;
    this.categories = categories;
    this.comments = comments;
  }

  public cardAdd(request: CardAddRequest): AppSnapshot {
    const card = createCard(request, this.nextCardNumber);
    return new AppSnapshot(
      [...this.cards, card],
      this.nextCardNumber + 1,
      this.categories,
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

  public findCategoryById(categoryId: string): Category | null {
    return this.allCategories().find(category => category.id == categoryId) ?? null;
  }

  public categoryAdd(request: CategoryAddRequest): AppSnapshot {
    const category = createCategory(request);
    return new AppSnapshot(
      this.cards,
      this.nextCardNumber,
      [...this.categories, category],
      this.comments,
    );
  }

  public categoryReorder(request: CategoryReorderRequest): AppSnapshot {
    const newCategories = reorder(
      this.categories,
      category => category.id,
      request.ids,
    );

    return new AppSnapshot(
      this.cards,
      this.nextCardNumber,
      newCategories,
      this.comments,
    );
  }

  public availableCategories(): ReadonlyArray<Category> {
    return this.categories;
  }

  public allCategories(): ReadonlyArray<Category> {
    return this.categories;
  }

  public allPresetColors(): ReadonlyArray<PresetColor> {
    return presetColors;
  }

  public findPresetColorById(presetColorId: string): PresetColor | null {
    return presetColors.find(presetColor => presetColor.id === presetColorId) ?? null;
  }

  public commentAdd(request: CommentAddRequest): AppSnapshot {
    const comment = createComment(request);
    return new AppSnapshot(
      this.cards,
      this.nextCardNumber,
      this.categories,
      [...this.comments, comment],
    );
  }

  public findCommentsByCardId(cardId: string): ReadonlyArray<Comment> {
    return this.comments.filter(comment => comment.cardId === cardId);
  }
}

export function initialAppSnapshot(): AppSnapshot {
  return new AppSnapshot([], 1, [], []);
}

export interface AppUpdate {
  updateId: string;
  request: Request;
}

export type Request =
  | {type: "cardAdd", cardAdd: CardAddRequest}
  | {type: "cardEdit", cardEdit: CardEditRequest}
  | {type: "categoryAdd", categoryAdd: CategoryAddRequest}
  | {type: "categoryReorder", categoryReorder: CategoryReorderRequest}
  | {type: "commentAdd", commentAdd: CommentAddRequest};

export const requests = {
  cardAdd(request: CardAddRequest): Request {
    return {type: "cardAdd", cardAdd: request};
  },

  cardEdit(request: CardEditRequest): Request {
    return {type: "cardEdit", cardEdit: request};
  },

  categoryAdd(request: CategoryAddRequest): Request {
    return {type: "categoryAdd", categoryAdd: request};
  },

  categoryReorder(request: CategoryReorderRequest): Request {
    return {type: "categoryReorder", categoryReorder: request};
  },

  commentAdd(request: CommentAddRequest): Request {
    return {type: "commentAdd", commentAdd: request};
  },
};

export function requestCreatedAt(request: Request): Instant {
  switch (request.type) {
    case "cardAdd":
      return request.cardAdd.createdAt;
    case "cardEdit":
      return request.cardEdit.createdAt;
    case "categoryAdd":
      return request.categoryAdd.createdAt;
    case "categoryReorder":
      return request.categoryReorder.createdAt;
    case "commentAdd":
      return request.commentAdd.createdAt;
    default:
      return assertNever(request, Instant.now());
  }
}

export function applySnapshotUpdate(snapshot: AppSnapshot, update: AppUpdate): AppSnapshot {
  switch (update.request.type) {
    case "cardAdd":
      return snapshot.cardAdd(update.request.cardAdd);
    case "cardEdit":
      return snapshot.cardEdit(update.request.cardEdit);
    case "categoryAdd":
      return snapshot.categoryAdd(update.request.categoryAdd);
    case "categoryReorder":
      return snapshot.categoryReorder(update.request.categoryReorder);
    case "commentAdd":
      return snapshot.commentAdd(update.request.commentAdd);
    default:
      return assertNever(update.request, snapshot);
  }
}
