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
  public readonly updateIds: ReadonlyArray<string>;
  public readonly cards: ReadonlyArray<Card>;

  public constructor(updateIds: ReadonlyArray<string>, cards: ReadonlyArray<Card>) {
    this.updateIds = updateIds;
    this.cards = cards;
  }

  public addUpdateId(updateId: string): AppState {
    return new AppState(
      [...this.updateIds, updateId],
      this.cards,
    );
  }

  public cardAdd(request: CardAddRequest): AppState {
    const card: Card = {
      id: request.id,
      parentCardId: request.parentCardId,
      text: request.text,
    };
    return new AppState(
      this.updateIds,
      [...this.cards, card]
    );
  }

  public cardDelete(request: CardDeleteRequest): AppState {
    return new AppState(
      this.updateIds,
      this.cards.filter(card => card.id !== request.id)
    );
  }
}

export function initialAppState(): AppState {
  return new AppState([], []);
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
