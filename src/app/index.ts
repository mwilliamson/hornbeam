import assertNever from "../util/assertNever";
import { Card, CardAddRequest, CardEditRequest, CardSet, createCard, updateCard } from "./cards";
import { Category, CategoryAddRequest, CategorySet, createCategory } from "./categories";
import { ColorSet, PresetColor, presetColors } from "./colors";
import { Comment, CommentAddRequest, CommentSet, createComment } from "./comments";

export class AppState implements CardSet, CategorySet, ColorSet, CommentSet {
  public readonly updateIds: ReadonlyArray<string>;
  public readonly cards: ReadonlyArray<Card>;
  private readonly nextCardNumber: number;
  private readonly categories: ReadonlyArray<Category>;
  private readonly comments: ReadonlyArray<Comment>;

  public constructor(
    updateIds: ReadonlyArray<string>,
    cards: ReadonlyArray<Card>,
    nextCardNumber: number,
    categories: ReadonlyArray<Category>,
    comments: ReadonlyArray<Comment>,
  ) {
    this.updateIds = updateIds;
    this.cards = cards;
    this.nextCardNumber = nextCardNumber;
    this.categories = categories;
    this.comments = comments;
  }

  public addUpdateId(updateId: string): AppState {
    return new AppState(
      [...this.updateIds, updateId],
      this.cards,
      this.nextCardNumber,
      this.categories,
      this.comments,
    );
  }

  public cardAdd(request: CardAddRequest): AppState {
    const card = createCard(request, this.nextCardNumber);
    return new AppState(
      this.updateIds,
      [...this.cards, card],
      this.nextCardNumber + 1,
      this.categories,
      this.comments,
    );
  }

  public cardEdit(request: CardEditRequest): AppState {
    return new AppState(
      this.updateIds,
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

  public countCardChildren(cardId: string): number {
    return this.cards.filter(card => card.parentCardId === cardId).length;
  }

  public findCardById(cardId: string): Card | null {
    return this.cards.find(card => card.id == cardId) ?? null;
  }

  public findCategoryById(categoryId: string): Category | null {
    return this.allCategories().find(category => category.id == categoryId) ?? null;
  }

  public categoryAdd(request: CategoryAddRequest): AppState {
    const category = createCategory(request);
    return new AppState(
      this.updateIds,
      this.cards,
      this.nextCardNumber,
      [...this.categories, category],
      this.comments,
    );
  }

  public availableCategories(): ReadonlyArray<Category> {
    return this.categories;
  }

  private allCategories(): ReadonlyArray<Category> {
    return this.categories;
  }

  public findPresetColorById(presetColorId: string): PresetColor | null {
    return presetColors.find(presetColor => presetColor.id === presetColorId) ?? null;
  }

  public commentAdd(request: CommentAddRequest): AppState {
    const comment = createComment(request);
    return new AppState(
      this.updateIds,
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

export function initialAppState(): AppState {
  return new AppState([], [], 1, [], []);
}

export interface AppUpdate {
  updateId: string;
  request: Request;
}

export type Request =
  | {type: "cardAdd", cardAdd: CardAddRequest}
  | {type: "cardEdit", cardEdit: CardEditRequest}
  | {type: "categoryAdd", categoryAdd: CategoryAddRequest}
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

  commentAdd(request: CommentAddRequest): Request {
    return {type: "commentAdd", commentAdd: request};
  },
};

export function applyAppUpdate(state: AppState, update: AppUpdate): AppState {
  switch (update.request.type) {
    case "cardAdd":
      state = state.cardAdd(update.request.cardAdd);
      break;
    case "cardEdit":
      state = state.cardEdit(update.request.cardEdit);
      break;
    case "categoryAdd":
      state = state.categoryAdd(update.request.categoryAdd);
      break;
    case "commentAdd":
      state = state.commentAdd(update.request.commentAdd);
      break;
    default:
      assertNever(update.request, null);
      break;
  }

  return state.addUpdateId(update.updateId);
}
