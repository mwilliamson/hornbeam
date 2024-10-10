import { Instant } from "@js-joda/core";
import { handleNever } from "../util/assertNever";
import { Card, CardAddEffect, CardAddMutation, CardEditEffect, CardEditMutation, CardMoveEffect, CardMoveMutation, CardMoveToAfterEffect, CardMoveToAfterMutation, CardMoveToBeforeEffect, CardMoveToBeforeMutation, CardSet, createCard, updateCard } from "./cards";
import { Category, CategoryAddEffect, CategoryAddMutation, CategoryReorderEffect, CategoryReorderMutation, CategorySet, CategorySetInMemory } from "./categories";
import { ColorSet, colorSetPresetsOnly, PresetColor } from "./colors";
import { Comment, CommentAddEffect, CommentAddMutation, CommentSet, createComment } from "./comments";
import { createProject, Project, ProjectAddEffect, ProjectAddMutation } from "./projects";
import { generateId } from "./ids";

export class AppSnapshot {
  private readonly projects: ReadonlyArray<Project>;
  private readonly projectContents: Map<string, ProjectContentsSnapshot>;

  constructor(
    projects: ReadonlyArray<Project>,
    projectContents: Map<string, ProjectContentsSnapshot>,
  ) {
    this.projects = projects;
    this.projectContents = projectContents;
  }

  public projectAdd(effect: ProjectAddEffect): AppSnapshot {
    const projectContents = new Map(this.projectContents);
    projectContents.set(effect.id, initialProjectContentsSnapshot());
    return new AppSnapshot(
      [...this.projects, createProject(effect)],
      projectContents,
    );
  }

  public allProjects(): ReadonlyArray<Project> {
    return this.projects;
  }

  public fetchProjectContents(projectId: string): ProjectContentsSnapshot {
    const projectContents = this.projectContents.get(projectId);
    if (projectContents === undefined) {
      throw new Error(`project not found: ${projectId}`);
    } else {
      return projectContents;
    }
  }

  public mutateProjectContents(
    effect: ProjectContentsEffect,
  ): AppSnapshot {
    const projectId = projectContentsEffectProjectId(effect);

    return this.updateProjectContents(
      projectId,
      projectContents => applyProjectContentsEffect(projectContents, effect),
    );
  }

  private updateProjectContents(
    projectId: string,
    f: (projectContents: ProjectContentsSnapshot) => ProjectContentsSnapshot,
  ): AppSnapshot {
    const projectContents = new Map(this.projectContents);
    projectContents.set(projectId, f(this.fetchProjectContents(projectId)));

    return new AppSnapshot(this.projects, projectContents);
  }
}

export function initialAppSnapshot(): AppSnapshot {
  return new AppSnapshot([], new Map());
}

export interface AppUpdate {
  updateId: string;
  effect: AppEffect;
}

export type AppMutation<TEffect> =
  | ProjectContentsMutation<TEffect>
  | {
    type: "projectAdd",
    proof: (effect: ProjectAddEffect) => TEffect,
    value: ProjectAddMutation,
  };

export type AppEffect =
  | ProjectContentsEffect
  | {type: "projectAdd", value: ProjectAddEffect};

export function applyAppEffect(
  snapshot: AppSnapshot,
  effect: AppEffect,
): AppSnapshot {
  switch (effect.type) {
    case "projectAdd":
      return snapshot.projectAdd(effect.value);
    default:
      return snapshot.mutateProjectContents(effect);
  }
}

export class ProjectContentsSnapshot implements CardSet, CategorySet, ColorSet, CommentSet {
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

  public cardAdd(effect: CardAddEffect): ProjectContentsSnapshot {
    const card = createCard(effect, this.nextCardNumber);
    return new ProjectContentsSnapshot(
      [...this.cards, card],
      this.nextCardNumber + 1,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public cardEdit(effect: CardEditEffect): ProjectContentsSnapshot {
    return new ProjectContentsSnapshot(
      this.cards.map(card => {
        if (card.id !== effect.id) {
          return card;
        }

        return updateCard(card, effect.edits);
      }),
      this.nextCardNumber,
      this.categories,
      this.colors,
      this.comments,
    );
  }

  public cardMove(effect: CardMoveEffect): ProjectContentsSnapshot {
    const card = this.findCardById(effect.id);

    if (card === null) {
      return this;
    }

    const siblingCards = this.cards
      .filter(otherCard => otherCard.parentCardId === card.parentCardId);

    const siblingIndex = siblingCards.findIndex(siblingCard => siblingCard.id === card.id);

    let swapWithCard: Card;

    switch (effect.direction) {
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
        return handleNever(effect.direction, this);
    }

    return new ProjectContentsSnapshot(
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

  public cardMoveToAfter(effect: CardMoveToAfterEffect): ProjectContentsSnapshot {
    if (effect.afterCardId === effect.moveCardId) {
      return this;
    }

    const afterCard = this.cards.find(card => card.id === effect.afterCardId);
    if (afterCard === undefined) {
      return this;
    }

    const movedCard = this.cards.find(card => card.id === effect.moveCardId);
    if (movedCard === undefined) {
      return this;
    }

    return new ProjectContentsSnapshot(
      this.cards.flatMap(card => {
        if (card.id === effect.moveCardId) {
          return [];
        } else if (card.id === effect.afterCardId) {
          return [
            card,
            updateCard(movedCard, {
              parentCardId: effect.parentCardId,
            }),
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

  public cardMoveToBefore(effect: CardMoveToBeforeEffect): ProjectContentsSnapshot {
    if (effect.beforeCardId === effect.moveCardId) {
      return this;
    }

    const beforeCard = this.cards.find(card => card.id === effect.beforeCardId);
    if (beforeCard === undefined) {
      return this;
    }

    const movedCard = this.cards.find(card => card.id === effect.moveCardId);
    if (movedCard === undefined) {
      return this;
    }

    return new ProjectContentsSnapshot(
      this.cards.flatMap(card => {
        if (card.id === effect.moveCardId) {
          return [];
        } else if (card.id === effect.beforeCardId) {
          return [
            updateCard(movedCard, {
              parentCardId: effect.parentCardId,
            }),
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

  public categoryAdd(effect: CategoryAddEffect): ProjectContentsSnapshot {
    return new ProjectContentsSnapshot(
      this.cards,
      this.nextCardNumber,
      this.categories.categoryAdd(effect),
      this.colors,
      this.comments,
    );
  }

  public categoryReorder(effect: CategoryReorderEffect): ProjectContentsSnapshot {
    return new ProjectContentsSnapshot(
      this.cards,
      this.nextCardNumber,
      this.categories.categoryReorder(effect),
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

  public commentAdd(effect: CommentAddEffect): ProjectContentsSnapshot {
    const comment = createComment(effect);
    return new ProjectContentsSnapshot(
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

export function initialProjectContentsSnapshot(): ProjectContentsSnapshot {
  return new ProjectContentsSnapshot(
    [],
    1,
    new CategorySetInMemory([]),
    colorSetPresetsOnly,
    [],
  );
}

export type ProjectContentsMutation<TEffect> =
  | {
    type: "cardAdd",
    proof: (effect: CardAddEffect) => TEffect,
    value: CardAddMutation,
  }
  | {
    type: "cardEdit",
    proof: (effect: CardEditEffect) => TEffect,
    value: CardEditMutation,
  }
  | {
    type: "cardMove",
    proof: (effect: CardMoveEffect) => TEffect,
    value: CardMoveMutation,
  }
  | {
    type: "cardMoveToAfter",
    proof: (effect: CardMoveToAfterEffect) => TEffect,
    value: CardMoveToAfterMutation,
  }
  | {
    type: "cardMoveToBefore",
    proof: (effect: CardMoveToBeforeEffect) => TEffect,
    value: CardMoveToBeforeMutation,
  }
  | {
    type: "categoryAdd",
    proof: (effect: CategoryAddEffect) => TEffect,
    value: CategoryAddMutation,
  }
  | {
    type: "categoryReorder",
    proof: (effect: CategoryReorderEffect) => TEffect,
    value: CategoryReorderMutation,
  }
  | {
    type: "commentAdd",
    proof: (effect: CommentAddEffect) => TEffect,
    value: CommentAddMutation
  };

export const appMutations = {
  cardAdd(mutation: CardAddMutation): ProjectContentsMutation<CardAddEffect> {
    return {type: "cardAdd", proof, value: mutation};
  },

  cardEdit(mutation: CardEditMutation): ProjectContentsMutation<CardEditEffect> {
    return {type: "cardEdit", proof, value: mutation};
  },

  cardMove(mutation: CardMoveMutation): ProjectContentsMutation<CardMoveEffect> {
    return {type: "cardMove", proof, value: mutation};
  },

  cardMoveToAfter(mutation: CardMoveToAfterMutation): ProjectContentsMutation<CardMoveToAfterEffect> {
    return {type: "cardMoveToAfter", proof, value: mutation};
  },

  cardMoveToBefore(mutation: CardMoveToBeforeMutation): ProjectContentsMutation<CardMoveToBeforeEffect> {
    return {type: "cardMoveToBefore", proof, value: mutation};
  },

  categoryAdd(mutation: CategoryAddMutation): ProjectContentsMutation<CategoryAddEffect> {
    return {type: "categoryAdd", proof, value: mutation};
  },

  categoryReorder(mutation: CategoryReorderMutation): ProjectContentsMutation<CategoryReorderEffect> {
    return {type: "categoryReorder", proof, value: mutation};
  },

  commentAdd(mutation: CommentAddMutation): ProjectContentsMutation<CommentAddEffect> {
    return {type: "commentAdd", proof, value: mutation};
  },

  projectAdd(mutation: ProjectAddMutation): AppMutation<ProjectAddEffect> {
    return {type: "projectAdd", proof, value: mutation};
  },
};

export type ProjectContentsEffect =
  | {type: "cardAdd", value: CardAddEffect}
  | {type: "cardEdit", value: CardEditEffect}
  | {type: "cardMove", value: CardMoveEffect}
  | {type: "cardMoveToAfter", value: CardMoveToAfterEffect}
  | {type: "cardMoveToBefore", value: CardMoveToBeforeEffect}
  | {type: "categoryAdd", value: CategoryAddEffect}
  | {type: "categoryReorder", value: CategoryReorderEffect}
  | {type: "commentAdd", value: CommentAddEffect};

export const appEffects = {
  cardAdd(effect: CardAddEffect): ProjectContentsEffect {
    return {type: "cardAdd", value: effect};
  },

  cardEdit(effect: CardEditEffect): ProjectContentsEffect {
    return {type: "cardEdit", value: effect};
  },

  cardMove(effect: CardMoveEffect): ProjectContentsEffect {
    return {type: "cardMove", value: effect};
  },

  cardMoveToAfter(effect: CardMoveToAfterEffect): ProjectContentsEffect {
    return {type: "cardMoveToAfter", value: effect};
  },

  cardMoveToBefore(effect: CardMoveToBeforeEffect): ProjectContentsEffect {
    return {type: "cardMoveToBefore", value: effect};
  },

  categoryAdd(effect: CategoryAddEffect): ProjectContentsEffect {
    return {type: "categoryAdd", value: effect};
  },

  categoryReorder(effect: CategoryReorderEffect): ProjectContentsEffect {
    return {type: "categoryReorder", value: effect};
  },

  commentAdd(effect: CommentAddEffect): ProjectContentsEffect {
    return {type: "commentAdd", value: effect};
  },

  projectAdd(effect: ProjectAddEffect): AppEffect {
    return {type: "projectAdd", value: effect};
  },
};

export function projectContentsEffectCreatedAt(effect: ProjectContentsEffect): Instant {
  return effect.value.createdAt;
}

function projectContentsEffectProjectId(effect: ProjectContentsEffect): string {
  return effect.value.projectId;
}

function applyProjectContentsEffect(
  snapshot: ProjectContentsSnapshot,
  mutation: ProjectContentsEffect,
): ProjectContentsSnapshot {
  switch (mutation.type) {
    case "cardAdd":
      return snapshot.cardAdd(mutation.value);
    case "cardEdit":
      return snapshot.cardEdit(mutation.value);
    case "cardMove":
      return snapshot.cardMove(mutation.value);
    case "cardMoveToAfter":
      return snapshot.cardMoveToAfter(mutation.value);
    case "cardMoveToBefore":
      return snapshot.cardMoveToBefore(mutation.value);
    case "categoryAdd":
      return snapshot.categoryAdd(mutation.value);
    case "categoryReorder":
      return snapshot.categoryReorder(mutation.value);
    case "commentAdd":
      return snapshot.commentAdd(mutation.value);
    default:
      return handleNever(mutation, snapshot);
  }
}

export function appMutationToEffect<TEffect>(mutation: AppMutation<TEffect>): TEffect {
  switch (mutation.type) {
    case "cardAdd":
      return mutation.proof({
        ...mutation.value,
        createdAt: Instant.now(),
        id: generateId(),
      });

    case "cardEdit":
      return mutation.proof({
        ...mutation.value,
        createdAt: Instant.now(),
      });

    case "cardMove":
      return mutation.proof({
        ...mutation.value,
        createdAt: Instant.now(),
      });

    case "cardMoveToAfter":
      return mutation.proof({
        ...mutation.value,
        createdAt: Instant.now(),
      });

    case "cardMoveToBefore":
      return mutation.proof({
        ...mutation.value,
        createdAt: Instant.now(),
      });

    case "categoryAdd":
      return mutation.proof({
        ...mutation.value,
        createdAt: Instant.now(),
        id: generateId(),
      });

    case "categoryReorder":
      return mutation.proof({
        ...mutation.value,
        createdAt: Instant.now(),
      });

    case "commentAdd":
      return mutation.proof({
        ...mutation.value,
        createdAt: Instant.now(),
        id: generateId(),
      });

    case "projectAdd":
      return mutation.proof({
        ...mutation.value,
        createdAt: Instant.now(),
        id: generateId(),
      });
  }
}

export function appMutationToAppEffect<TEffect>(mutation: AppMutation<TEffect>): AppEffect {
  switch (mutation.type) {
    case "cardAdd":
      return appEffects.cardAdd(appMutationToEffect(appMutations.cardAdd(mutation.value)));

    case "cardEdit":
      return appEffects.cardEdit(appMutationToEffect(appMutations.cardEdit(mutation.value)));

    case "cardMove":
      return appEffects.cardMove(appMutationToEffect(appMutations.cardMove(mutation.value)));

    case "cardMoveToAfter":
      return appEffects.cardMoveToAfter(appMutationToEffect(appMutations.cardMoveToAfter(mutation.value)));

    case "cardMoveToBefore":
      return appEffects.cardMoveToBefore(appMutationToEffect(appMutations.cardMoveToBefore(mutation.value)));

    case "categoryAdd":
      return appEffects.categoryAdd(appMutationToEffect(appMutations.categoryAdd(mutation.value)));

    case "categoryReorder":
      return appEffects.categoryReorder(appMutationToEffect(appMutations.categoryReorder(mutation.value)));

    case "commentAdd":
      return appEffects.commentAdd(appMutationToEffect(appMutations.commentAdd(mutation.value)));

    case "projectAdd":
      return appEffects.projectAdd(appMutationToEffect(appMutations.projectAdd(mutation.value)));
  }
}

function proof<T>(value: T): T {
  return value;
}
