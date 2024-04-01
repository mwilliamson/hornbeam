export interface Card {
  id: string;
  text: string;
}

export interface CardAddRequest {
  id: string;
  text: string;
}

export class AppState {
  public readonly cards: ReadonlyArray<Card>;

  public constructor(cards: ReadonlyArray<Card>) {
    this.cards = cards;
  }

  public cardAdd(request: CardAddRequest): AppState {
    return new AppState(
      [...this.cards, {id: request.id, text: request.text}]
    );
  }
}

export function initialAppState(): AppState {
  return new AppState([]);
}

export type AppUpdate =
  | {type: "cardAdd", request: CardAddRequest};

export function applyAppUpdate(state: AppState, update: AppUpdate): AppState {
  switch (update.type) {
    case "cardAdd":
      return state.cardAdd(update.request);
  }
}
