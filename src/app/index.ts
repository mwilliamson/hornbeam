import { Card, CardAddRequest, CardDeleteRequest, CardEditRequest, CardSet, createCard, updateCard } from "./cards";
import { Category, CategorySet, allCategories } from "./categories";
import { ColorSet, PresetColor, presetColors } from "./colors";

export class AppState implements CardSet, CategorySet, ColorSet {
  public readonly updateIds: ReadonlyArray<string>;
  public readonly cards: ReadonlyArray<Card>;
  private readonly nextCardNumber: number;

  public constructor(
    updateIds: ReadonlyArray<string>,
    cards: ReadonlyArray<Card>,
    nextCardNumber: number,
  ) {
    this.updateIds = updateIds;
    this.cards = cards;
    this.nextCardNumber = nextCardNumber;
  }

  public addUpdateId(updateId: string): AppState {
    return new AppState(
      [...this.updateIds, updateId],
      this.cards,
      this.nextCardNumber,
    );
  }

  public cardAdd(request: CardAddRequest): AppState {
    const card = createCard(request, this.nextCardNumber);
    return new AppState(
      this.updateIds,
      [...this.cards, card],
      this.nextCardNumber + 1,
    );
  }

  public cardDelete(request: CardDeleteRequest): AppState {
    return new AppState(
      this.updateIds,
      this.cards.filter(card => card.id !== request.id),
      this.nextCardNumber,
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

  public availableCategories(): ReadonlyArray<Category> {
    return allCategories;
  }

  private allCategories(): ReadonlyArray<Category> {
    return allCategories;
  }

  public findPresetColorById(presetColorId: string): PresetColor | null {
    return presetColors.find(presetColor => presetColor.id === presetColorId) ?? null;
  }
}

export function initialAppState(): AppState {
  return new AppState([], [], 1);
}

export interface AppUpdate {
  updateId: string;
  request: Request;
}

export type Request =
  | {type: "cardAdd", cardAdd: CardAddRequest}
  | {type: "cardDelete", cardDelete: CardDeleteRequest}
  | {type: "cardEdit", cardEdit: CardEditRequest};

export const requests = {
  cardAdd(request: CardAddRequest): Request {
    return {type: "cardAdd", cardAdd: request};
  },

  cardDelete(request: CardDeleteRequest): Request {
    return {type: "cardDelete", cardDelete: request};
  },

  cardEdit(request: CardEditRequest): Request {
    return {type: "cardEdit", cardEdit: request};
  }
};

export function applyAppUpdate(state: AppState, update: AppUpdate): AppState {
  switch (update.request.type) {
    case "cardAdd":
      state = state.cardAdd(update.request.cardAdd);
      break;
    case "cardDelete":
      state = state.cardDelete(update.request.cardDelete);
      break;
    case "cardEdit":
      state = state.cardEdit(update.request.cardEdit);
      break;
  }

  return state.addUpdateId(update.updateId);
}
