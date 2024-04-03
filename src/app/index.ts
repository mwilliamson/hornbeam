export interface Card {
  id: string;
  parentCardId: string | null;
  text: string;
}

export interface CardAddRequest {
  id: string;
  parentCardId: string | null;
  text: string;
}

export interface CardDeleteRequest {
  id: string;
}

export class AppState {
  public readonly cards: ReadonlyArray<Card>;

  public constructor(cards: ReadonlyArray<Card>) {
    this.cards = cards;
  }

  public cardAdd(request: CardAddRequest): AppState {
    const card: Card = {
      id: request.id,
      parentCardId: request.parentCardId,
      text: request.text,
    };
    return new AppState(
      [...this.cards, card]
    );
  }

  public cardDelete(request: CardDeleteRequest): AppState {
    return new AppState(
      this.cards.filter(card => card.id !== request.id)
    );
  }
}

export function initialAppState(): AppState {
  return new AppState([]);
}

export type AppUpdate =
  | {type: "cardAdd", request: CardAddRequest}
  | {type: "cardDelete", request: CardDeleteRequest};

export const appUpdates = {
  cardAdd(request: CardAddRequest): AppUpdate {
    return {type: "cardAdd", request};
  },

  cardDelete(request: CardDeleteRequest): AppUpdate {
    return {type: "cardDelete", request};
  },
};

export function applyAppUpdate(state: AppState, update: AppUpdate): AppState {
  switch (update.type) {
    case "cardAdd":
      return state.cardAdd(update.request);
    case "cardDelete":
      return state.cardDelete(update.request);
  }
}
