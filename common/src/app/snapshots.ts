import { Instant } from "@js-joda/core";
import { handleNever } from "../util/assertNever";
import { Card, CardAddMutation, CardEditMutation, CardMoveMutation, CardMoveToAfterMutation, CardMoveToBeforeMutation, CardSet, createCard, updateCard } from "./cards";
import { Category, CategoryAddMutation, CategoryReorderMutation, CategorySet, CategorySetInMemory } from "./categories";
import { ColorSet, colorSetPresetsOnly, PresetColor } from "./colors";
import { Comment, CommentAddMutation, CommentSet, createComment } from "./comments";

export class AppSnapshot implements CardSet, CategorySet, ColorSet, CommentSet {
  private readonly cards: ReadonlyArray<Card>;
  private readonly nextCardNumber: number;
  private readonly categories: CategorySetInMemory;
  private readonly colors: ColorSet;
  private readonly comments: ReadonlyArray<Comment>;

  public constructor(
    cards: ReadonlyArray<Card>,
    nextCardNumber: number,
    categories: CategorySetInMemory,
    colors: ColorSet,
    comments: ReadonlyArray<Comment>,
  ) {
    this.cards = cards;
    this.nextCardNumber = nextCardNumber;
    this.categories = categories;
    this.colors = colors;
    this.comments = comments;
  }

  public cardAdd(mutation: CardAddMutation): AppSnapshot {
    const card = createCard(mutation, this.nextCardNumber);
    return new AppSnapshot(
      [...this.cards, card],
      this.nextCardNumber + 1,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public cardEdit(request: CardEditMutation): AppSnapshot {
    return new AppSnapshot(
      this.cards.map(card => {
        if (card.id !== request.id) {
          return card;
        }

        return updateCard(card, request);
      }),
      this.nextCardNumber,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public cardMove(request: CardMoveMutation): AppSnapshot {
    const card = this.findCardById(request.id);

    if (card === null) {
      return this;
    }

    const siblingCards = this.cards
      .filter(otherCard => otherCard.parentCardId === card.parentCardId);

    const siblingIndex = siblingCards.findIndex(siblingCard => siblingCard.id === card.id);

    let swapWithCard: Card;

    switch (request.direction) {
      case "up":
        if (siblingIndex === 0) {
          return this;
        }
        swapWithCard = siblingCards[siblingIndex - 1];
        break;
      case "down":
        if (siblingIndex === siblingCards.length - 1) {
          return this;
        }
        swapWithCard = siblingCards[siblingIndex + 1];
        break;
      default:
        return handleNever(request.direction, this);
    }

    return new AppSnapshot(
      this.cards.map(otherCard => {
        if (otherCard.id === card.id) {
          return swapWithCard;
        } else if (otherCard.id === swapWithCard.id) {
          return card;
        } else {
          return otherCard;
        }
      }),
      this.nextCardNumber,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public cardMoveToAfter(request: CardMoveToAfterMutation): AppSnapshot {
    if (request.afterCardId === request.moveCardId) {
      return this;
    }

    const afterCard = this.cards.find(card => card.id === request.afterCardId);
    if (afterCard === undefined) {
      return this;
    }

    const movedCard = this.cards.find(card => card.id === request.moveCardId);
    if (movedCard === undefined) {
      return this;
    }

    return new AppSnapshot(
      this.cards.flatMap(card => {
        if (card.id === request.moveCardId) {
          return [];
        } else if (card.id === request.afterCardId) {
          return [
            card,
            updateCard(movedCard, {parentCardId: request.parentCardId}),
          ];
        } else {
          return [card];
        }
      }),
      this.nextCardNumber,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public cardMoveToBefore(request: CardMoveToBeforeMutation): AppSnapshot {
    if (request.beforeCardId === request.moveCardId) {
      return this;
    }

    const beforeCard = this.cards.find(card => card.id === request.beforeCardId);
    if (beforeCard === undefined) {
      return this;
    }

    const movedCard = this.cards.find(card => card.id === request.moveCardId);
    if (movedCard === undefined) {
      return this;
    }

    return new AppSnapshot(
      this.cards.flatMap(card => {
        if (card.id === request.moveCardId) {
          return [];
        } else if (card.id === request.beforeCardId) {
          return [
            updateCard(movedCard, {parentCardId: request.parentCardId}),
            card,
          ];
        } else {
          return [card];
        }
      }),
      this.nextCardNumber,
      this.categories,
      this.colors,
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

  public searchCards(query: string): ReadonlyArray<Card> {
    query = query.toLowerCase();

    return this.cards.filter(card => {
      // TODO: include numbers
      // TODO: prefer shorter matches
      // TODO: prefer match at start of text
      // TODO: normalise text
      // TODO: tokenize
      return card.text.toLowerCase().includes(query);
    });
  }

  public findCategoryById(categoryId: string): Category | null {
    return this.allCategories().find(category => category.id == categoryId) ?? null;
  }

  public categoryAdd(request: CategoryAddMutation): AppSnapshot {
    return new AppSnapshot(
      this.cards,
      this.nextCardNumber,
      this.categories.categoryAdd(request),
      this.colors,
      this.comments,
    );
  }

  public categoryReorder(request: CategoryReorderMutation): AppSnapshot {
    return new AppSnapshot(
      this.cards,
      this.nextCardNumber,
      this.categories.categoryReorder(request),
      this.colors,
      this.comments,
    );
  }

  public availableCategories(): ReadonlyArray<Category> {
    return this.categories.availableCategories();
  }

  public allCategories(): ReadonlyArray<Category> {
    return this.categories.allCategories();
  }

  public allPresetColors(): ReadonlyArray<PresetColor> {
    return this.colors.allPresetColors();
  }

  public findPresetColorById(presetColorId: string): PresetColor | null {
    return this.colors.findPresetColorById(presetColorId);
  }

  public commentAdd(request: CommentAddMutation): AppSnapshot {
    const comment = createComment(request);
    return new AppSnapshot(
      this.cards,
      this.nextCardNumber,
      this.categories,
      this.colors,
      [...this.comments, comment],
    );
  }

  public findCommentsByCardId(cardId: string): ReadonlyArray<Comment> {
    return this.comments.filter(comment => comment.cardId === cardId);
  }
}

export function initialAppSnapshot(): AppSnapshot {
  return new AppSnapshot(
    [],
    1,
    new CategorySetInMemory([]),
    colorSetPresetsOnly,
    [],
  );
}

export interface AppUpdate {
  updateId: string;
  mutation: BoardContentsMutation;
}

export type BoardContentsMutation =
  | {type: "cardAdd", cardAdd: CardAddMutation}
  | {type: "cardEdit", cardEdit: CardEditMutation}
  | {type: "cardMove", cardMove: CardMoveMutation}
  | {type: "cardMoveToAfter", cardMoveToAfter: CardMoveToAfterMutation}
  | {type: "cardMoveToBefore", cardMoveToBefore: CardMoveToBeforeMutation}
  | {type: "categoryAdd", categoryAdd: CategoryAddMutation}
  | {type: "categoryReorder", categoryReorder: CategoryReorderMutation}
  | {type: "commentAdd", commentAdd: CommentAddMutation};

export const boardContentsMutations = {
  cardAdd(mutation: CardAddMutation): BoardContentsMutation {
    return {type: "cardAdd", cardAdd: mutation};
  },

  cardEdit(mutation: CardEditMutation): BoardContentsMutation {
    return {type: "cardEdit", cardEdit: mutation};
  },

  cardMove(mutation: CardMoveMutation): BoardContentsMutation {
    return {type: "cardMove", cardMove: mutation};
  },

  cardMoveToAfter(mutation: CardMoveToAfterMutation): BoardContentsMutation {
    return {type: "cardMoveToAfter", cardMoveToAfter: mutation};
  },

  cardMoveToBefore(mutation: CardMoveToBeforeMutation): BoardContentsMutation {
    return {type: "cardMoveToBefore", cardMoveToBefore: mutation};
  },

  categoryAdd(mutation: CategoryAddMutation): BoardContentsMutation {
    return {type: "categoryAdd", categoryAdd: mutation};
  },

  categoryReorder(mutation: CategoryReorderMutation): BoardContentsMutation {
    return {type: "categoryReorder", categoryReorder: mutation};
  },

  commentAdd(mutation: CommentAddMutation): BoardContentsMutation {
    return {type: "commentAdd", commentAdd: mutation};
  },
};

export function boardContentsMutationCreatedAt(mutation: BoardContentsMutation): Instant {
  switch (mutation.type) {
    case "cardAdd":
      return mutation.cardAdd.createdAt;
    case "cardEdit":
      return mutation.cardEdit.createdAt;
    case "cardMove":
      return mutation.cardMove.createdAt;
    case "cardMoveToAfter":
      return mutation.cardMoveToAfter.createdAt;
    case "cardMoveToBefore":
      return mutation.cardMoveToBefore.createdAt;
    case "categoryAdd":
      return mutation.categoryAdd.createdAt;
    case "categoryReorder":
      return mutation.categoryReorder.createdAt;
    case "commentAdd":
      return mutation.commentAdd.createdAt;
    default:
      return handleNever(mutation, Instant.now());
  }
}

export function applyBoardContentsMutation(snapshot: AppSnapshot, mutation: BoardContentsMutation): AppSnapshot {
  switch (mutation.type) {
    case "cardAdd":
      return snapshot.cardAdd(mutation.cardAdd);
    case "cardEdit":
      return snapshot.cardEdit(mutation.cardEdit);
    case "cardMove":
      return snapshot.cardMove(mutation.cardMove);
    case "cardMoveToAfter":
      return snapshot.cardMoveToAfter(mutation.cardMoveToAfter);
    case "cardMoveToBefore":
      return snapshot.cardMoveToBefore(mutation.cardMoveToBefore);
    case "categoryAdd":
      return snapshot.categoryAdd(mutation.categoryAdd);
    case "categoryReorder":
      return snapshot.categoryReorder(mutation.categoryReorder);
    case "commentAdd":
      return snapshot.commentAdd(mutation.commentAdd);
    default:
      return handleNever(mutation, snapshot);
  }
}
