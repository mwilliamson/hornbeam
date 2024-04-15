export interface Card {
  categoryId: string;
  id: string;
  number: number;
  parentCardId: string | null;
  text: string;
}

export interface CardAddRequest {
  categoryId: string;
  id: string;
  parentCardId: string | null;
  text: string;
}

export interface CardDeleteRequest {
  id: string;
}

export interface Category {
  id: string;
  name: string;
  color: Color;
}

export interface Color {
  hex: string;
}

const categories: ReadonlyArray<Category> = [
  {
    id: "018ec4b8-30c5-7c09-a519-4b460db76da5",
    name: "Goal",
    color: {hex: "#adf7b6"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b499ba9020c",
    name: "User Task",
    color: {hex: "#ffee93"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b4a243ce8c3",
    name: "Detail",
    color: {hex: "#a0ced9"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b486f2cb5c2",
    name: "Question",
    color: {hex: "#e6aeff"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b47c6a3cb5c",
    name: "Risk",
    color: {hex: "#ffc09f"},
  },
  {
    id: "018ec4b8-30c5-7c09-a519-4b45f141679a",
    name: "Bug",
    color: {hex: "#ffacbb"},
  },
];

export class AppState {
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
    const card: Card = {
      categoryId: request.categoryId,
      id: request.id,
      number: this.nextCardNumber,
      parentCardId: request.parentCardId,
      text: request.text,
    };
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

  public findCardById(cardId: string): Card | null {
    return this.cards.find(card => card.id == cardId) ?? null;
  }

  public allCategories(): ReadonlyArray<Category> {
    return categories;
  }

  public availableCategories(): ReadonlyArray<Category> {
    return categories;
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
  | {type: "cardDelete", cardDelete: CardDeleteRequest};

export const requests = {
  cardAdd(request: CardAddRequest): Request {
    return {type: "cardAdd", cardAdd: request};
  },

  cardDelete(request: CardDeleteRequest): Request {
    return {type: "cardDelete", cardDelete: request};
  },
};

export function applyAppUpdate(state: AppState, update: AppUpdate): AppState {
  switch (update.request.type) {
    case "cardAdd":
      state = state.cardAdd(update.request.cardAdd);
      break;
    case "cardDelete":
      state = state.cardDelete(update.request.cardDelete);
      break;
  }

  return state.addUpdateId(update.updateId);
}
