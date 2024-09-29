import { Transaction } from "kysely";
import { uuidv7 } from "uuidv7";
import { Database } from "./database";
import { DB } from "./database/types";
import { AppMutation } from "hornbeam-common/lib/app/snapshots";
import { MutationLogRepositoryDatabase } from "./repositories/mutationLog";
import { CategoryRepositoryDatabase } from "./repositories/categories";
import { CommentRepositoryDatabase } from "./repositories/comments";
import { ProjectRepositoryDatabase } from "./repositories/projects";
import { handleNever } from "hornbeam-common/lib/util/assertNever";
import { CardRepositoryDatabase } from "./repositories/cards";
import { serializeAllCategoriesResponse, serializeAllColorsResponse, serializeAllProjectsResponse, serializeBoardCardTreesResponse, serializeCardChildCountResponse, serializeCardHistoryResponse, serializeCardResponse, serializeParentBoardResponse, serializeParentCardResponse, serializeSearchCardsResponse, ServerQuery } from "hornbeam-common/lib/serialization/serverQueries";
import mapSeries from "p-map-series";
import { colorSetPresetsOnly } from "hornbeam-common/lib/app/colors";
import { CardHistoryFetcher } from "./repositories/cardHistory";

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

class AppTransaction {
  private readonly transaction: Transaction<DB>;

  constructor(transaction: Transaction<DB>) {
    this.transaction = transaction;
  }

  public async query(serverQueries: ReadonlyArray<ServerQuery>) {
    const mutationLogRepository = new MutationLogRepositoryDatabase(this.transaction);
    const latestIndex = await mutationLogRepository.fetchLatestIndex();
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
          const result = await cardRepository.fetchById(serverQuery.cardId);
          return serializeCardResponse(result);
        }
        case "parentCard": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.fetchParentByChildId(serverQuery.cardId);
          return serializeParentCardResponse(result);
        }
        case "cardChildCount": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.fetchChildCountByParentId(serverQuery.cardId);
          return serializeCardChildCountResponse(result);
        }
        case "cardHistory": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const commentRepository = new CommentRepositoryDatabase(this.transaction);
          const cardHistoryFetcher = new CardHistoryFetcher(cardRepository, commentRepository);
          const cardHistory = await cardHistoryFetcher.fetchCardHistoryById(serverQuery.cardId);
          return serializeCardHistoryResponse(cardHistory);
        }
        case "searchCards": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.search(serverQuery.searchTerm);
          return serializeSearchCardsResponse(result);
        }
        case "boardCardTrees": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.fetchBoardCardTrees(
            serverQuery.boardId,
            new Set(serverQuery.cardStatuses),
          );
          return serializeBoardCardTreesResponse(result);
        }
        case "parentBoard": {
          const cardRepository = new CardRepositoryDatabase(this.transaction);
          const result = await cardRepository.fetchParentBoard(serverQuery.boardId);
          return serializeParentBoardResponse(result);
        }
        case "allCategories": {
          const categoryRepository = new CategoryRepositoryDatabase(this.transaction);
          const result = await categoryRepository.fetchAll();
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
    mutation: AppMutation,
  ): Promise<number> {
    const mutationLogRepository = new MutationLogRepositoryDatabase(this.transaction);
    const index = await mutationLogRepository.add(uuidv7(), mutation);

    await this.applyMutation(mutation);

    return index;
  }

  private async applyMutation(
    mutation: AppMutation,
  ): Promise<void> {
    switch (mutation.type) {
      case "cardAdd": {
        const cardRepository = new CardRepositoryDatabase(this.transaction);
        await cardRepository.add(mutation.cardAdd);
        return;
      }
      case "cardEdit": {
        const cardRepository = new CardRepositoryDatabase(this.transaction);
        await cardRepository.update(mutation.cardEdit);
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
        await categoryRepository.add(mutation.categoryAdd);
        return;
      }
      case "categoryReorder": {
        const categoryRepository = new CategoryRepositoryDatabase(this.transaction);
        await categoryRepository.reorder(mutation.categoryReorder);
        return;
      }
      case "commentAdd": {
        const commentRepository = new CommentRepositoryDatabase(this.transaction);
        await commentRepository.add(mutation.commentAdd);
        return;
      }
      case "projectAdd": {
        const projectRepository = new ProjectRepositoryDatabase(this.transaction);
        await projectRepository.add(mutation.projectAdd);
        return;
      }
      default: {
        return handleNever(mutation, undefined);
      }
    }
  }
}
