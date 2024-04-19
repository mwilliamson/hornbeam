import { Card, CardAddRequest, CardEditRequest, CardSet, createCard, updateCard } from "./cards";
import { Category, CategoryAddRequest, CategorySet, createCategory } from "./categories";
import { ColorSet, PresetColor, presetColors } from "./colors";

export class AppState implements CardSet, CategorySet, ColorSet {
  public readonly updateIds: ReadonlyArray<string>;
  public readonly cards: ReadonlyArray<Card>;
  private readonly nextCardNumber: number;
  private readonly categories: ReadonlyArray<Category>;

  public constructor(
    updateIds: ReadonlyArray<string>,
    cards: ReadonlyArray<Card>,
    nextCardNumber: number,
    categories: ReadonlyArray<Category>
  ) {
    this.updateIds = updateIds;
    this.cards = cards;
    this.nextCardNumber = nextCardNumber;
    this.categories = categories;
  }

  public addUpdateId(updateId: string): AppState {
    return new AppState(
      [...this.updateIds, updateId],
      this.cards,
      this.nextCardNumber,
      this.categories,
    );
  }

  public cardAdd(request: CardAddRequest): AppState {
    const card = createCard(request, this.nextCardNumber);
    return new AppState(
      this.updateIds,
      [...this.cards, card],
      this.nextCardNumber + 1,
      this.categories,
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
}

export function initialAppState(): AppState {
  return new AppState([], [], 1, []);
}

export interface AppUpdate {
  updateId: string;
  request: Request;
}

export type Request =
  | {type: "cardAdd", cardAdd: CardAddRequest}
  | {type: "cardEdit", cardEdit: CardEditRequest}
  | {type: "categoryAdd", categoryAdd: CategoryAddRequest};

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
  }

  return state.addUpdateId(update.updateId);
}
