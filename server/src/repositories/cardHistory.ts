import { CardHistory } from "hornbeam-common/lib/app/cards";
import { CardRepository } from "./cards";
import { CommentRepository } from "./comments";
import { CardHistoryQuery } from "hornbeam-common/lib/queries";

export class CardHistoryFetcher {
  private readonly cardRepository: CardRepository;
  private readonly commentRepository: CommentRepository;

  constructor(cardRepository: CardRepository, commentRepository: CommentRepository) {
    this.cardRepository = cardRepository;
    this.commentRepository = commentRepository;
  }

  async fetchCardHistoryById(query: CardHistoryQuery): Promise<CardHistory> {
    const card = await this.cardRepository.fetchById(query);

    if (card === null) {
      return [];
    }

    const comments = await this.commentRepository.fetchByCardId(query.cardId);

    return [
      {
        type: "created",
        instant: card.createdAt,
      },
      ...comments.map(comment => ({
        type: "comment" as const,
        instant: comment.createdAt,
        comment,
      })),
    ];
  }
}
