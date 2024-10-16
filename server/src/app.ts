import { Transaction } from "kysely";
import { uuidv7 } from "uuidv7";
import { Database } from "./database";
import { DB } from "./database/types";
import { AppEffect, AppMutation, appMutationToAppEffect } from "hornbeam-common/lib/app/snapshots";
import { EffectLogRepositoryDatabase } from "./repositories/effectLog";
import { CategoryRepositoryDatabase } from "./repositories/categories";
import { CommentRepositoryDatabase } from "./repositories/comments";
import { ProjectRepositoryDatabase } from "./repositories/projects";
import { handleNever } from "hornbeam-common/lib/util/assertNever";
import { CardRepositoryDatabase } from "./repositories/cards";
import { serializeAllCategoriesResponse, serializeAllColorsResponse, serializeAllProjectsResponse, serializeBoardCardTreesResponse, serializeCardChildCountResponse, serializeCardHistoryResponse, serializeCardResponse, serializeParentBoardResponse, serializeParentCardResponse, serializeSearchCardsResponse, ServerQuery } from "hornbeam-common/lib/serialization/serverQueries";
import mapSeries from "p-map-series";
import { colorSetPresetsOnly } from "hornbeam-common/lib/app/colors";
import { CardHistoryFetcher } from "./services/cardHistory";
import { UserRepositoryDatabase } from "./repositories/users";

export class App {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  public async transaction<T>(f: (transaction: AppTransaction) => Promise<T>): Promise<T> {
    return this.database.transaction().execute(transaction => {
      const appTransaction = new AppTransaction(transaction);
      return f(appTransaction);
    });
  }
}

interface MutateResult {
  snapshotIndex: number;
  effect: AppEffect;
}

class AppTransaction {
  private readonly transaction: Transaction<DB>;

  constructor(transaction: Transaction<DB>) {
    this.transaction = transaction;
  }

  public async query(serverQueries: ReadonlyArray<ServerQuery>) {
    const effectLogRepository = new EffectLogRepositoryDatabase(this.transaction);
    const latestIndex = await effectLogRepository.fetchLatestIndex();
    return {
      latestIndex,
      queryResults: await this.executeQueries(serverQueries),
    };
  }

  private async executeQueries(
    serverQueries: ReadonlyArray<ServerQuery>,
  ) {
    return await mapSeries(serverQueries, async serverQuery => {
      switch (serverQuery.type) {
        case "card": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.fetchById(serverQuery);
          return serializeCardResponse(result);
        }
        case "parentCard": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.fetchParent(serverQuery);
          return serializeParentCardResponse(result);
        }
        case "cardChildCount": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.fetchChildCount(serverQuery);
          return serializeCardChildCountResponse(result);
        }
        case "cardHistory": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const commentRepository = new CommentRepositoryDatabase(this.transaction);
          const cardHistoryFetcher = new CardHistoryFetcher(cardRepository, commentRepository);
          const cardHistory = await cardHistoryFetcher.fetchCardHistoryById(serverQuery);
          return serializeCardHistoryResponse(cardHistory);
        }
        case "searchCards": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.search(serverQuery);
          return serializeSearchCardsResponse(result);
        }
        case "boardCardTrees": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.fetchBoardCardTrees({
            boardId: serverQuery.boardId,
            cardStatuses: new Set(serverQuery.cardStatuses),
            projectId: serverQuery.projectId,
          });
          return serializeBoardCardTreesResponse(result);
        }
        case "parentBoard": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.fetchParentBoard(serverQuery);
          return serializeParentBoardResponse(result);
        }
        case "allCategories": {
          const categoryRepository = new CategoryRepositoryDatabase(this.transaction);
          const result = await categoryRepository.fetchAllByProjectId(serverQuery.projectId);
          return serializeAllCategoriesResponse(result);
        }
        case "allColors": {
          return serializeAllColorsResponse(colorSetPresetsOnly.allPresetColors());
        }
        case "allProjects": {
          const projectRepository = new ProjectRepositoryDatabase(this.transaction);
          const result = await projectRepository.fetchAll();
          return serializeAllProjectsResponse(result);
        }
        default: {
          handleNever(serverQuery, null);
        }
      }
    });
  }

  public async mutate(
    mutation: AppMutation<unknown>,
  ): Promise<MutateResult> {
    const effect = appMutationToAppEffect(mutation);
    return {
      effect,
      snapshotIndex: await this.applyEffect(effect),
    };
  }

  public async applyEffect(
    effect: AppEffect,
  ): Promise<number> {
    const effectLogRepository = new EffectLogRepositoryDatabase(this.transaction);
    const index = await effectLogRepository.add(uuidv7(), effect);

    await this.playEffect(effect);

    return index;
  }

  private async playEffect(
    effect: AppEffect,
  ): Promise<void> {
    switch (effect.type) {
      case "cardAdd": {
        const cardRepository = new CardRepositoryDatabase(this.transaction);
        await cardRepository.add(effect.value);
        return;
      }
      case "cardEdit": {
        const cardRepository = new CardRepositoryDatabase(this.transaction);
        await cardRepository.update(effect.value);
        return;
      }
      case "cardMove": {
        throw new Error("cardMove not supported");
      }
      case "cardMoveToAfter": {
        throw new Error("cardMoveToAfter not supported");
      }
      case "cardMoveToBefore": {
        throw new Error("cardMoveToBefore not supported");
      }
      case "categoryAdd": {
        const categoryRepository = new CategoryRepositoryDatabase(this.transaction);
        await categoryRepository.add(effect.value);
        return;
      }
      case "categoryReorder": {
        const categoryRepository = new CategoryRepositoryDatabase(this.transaction);
        await categoryRepository.reorder(effect.value);
        return;
      }
      case "commentAdd": {
        const commentRepository = new CommentRepositoryDatabase(this.transaction);
        await commentRepository.add(effect.value);
        return;
      }
      case "projectAdd": {
        const projectRepository = new ProjectRepositoryDatabase(this.transaction);
        await projectRepository.add(effect.value);
        return;
      }
      case "userAdd": {
        const userRepository = new UserRepositoryDatabase(this.transaction);
        await userRepository.add(effect.value);
        return;
      }
      default: {
        return handleNever(effect, undefined);
      }
    }
  }
}
