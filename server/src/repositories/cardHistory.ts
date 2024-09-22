import { CardHistory } from "hornbeam-common/lib/app/cards";
import { CardRepository } from "./cards";

export class CardHistoryFetcher {
  private readonly cardRepository: CardRepository;

  constructor(cardRepository: CardRepository) {
    this.cardRepository = cardRepository;
  }

  async fetchCardHistoryById(cardId: string): Promise<CardHistory> {
    const card = await this.cardRepository.fetchById(cardId);

    if (card === null) {
      return [];
    }

    return [
      {
        type: "created",
        instant: card.createdAt,
      }
    ];
  }
}
