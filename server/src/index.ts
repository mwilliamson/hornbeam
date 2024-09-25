import "disposablestack/auto";
import { isLeft } from "fp-ts/lib/Either";
import mapSeries from "p-map-series";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { uuidv7 } from "uuidv7";
import path from "node:path";
import { QueryRequestBody, QueryResponseBody, UpdateRequestBody, UpdateResponseBody } from "hornbeam-common/lib/serialization/serverApi";
import {serializeAllCategoriesResponse, serializeAllColorsResponse, serializeBoardCardTreesResponse, serializeCardChildCountResponse, serializeCardHistoryResponse, serializeCardResponse, serializeParentBoardResponse, serializeParentCardResponse, serializeSearchCardsResponse, ServerQuery} from "hornbeam-common/lib/serialization/serverQueries";
import { handleNever } from "hornbeam-common/lib/util/assertNever";
import { databaseConnect } from "./database";
import { CardRepositoryDatabase } from "./repositories/cards";
import { CategoryRepositoryDatabase } from "./repositories/categories";
import { colorSetPresetsOnly } from "hornbeam-common/lib/app/colors";
import { AppMutation } from "hornbeam-common/lib/app/snapshots";
import { DB } from "./database/types";
import { Transaction } from "kysely";
import { CardHistoryFetcher } from "./repositories/cardHistory";
import { CommentRepositoryDatabase } from "./repositories/comments";
import { MutationLogRepositoryDatabase } from "./repositories/mutationLog";
import { ProjectRepositoryDatabase } from "./repositories/projects";

interface ServerOptions {
  databaseUrl: string;
  port: number;
}

interface Server {
  close: () => Promise<void>;
  port: () => number | null;
}

export async function startServer({databaseUrl, port}: ServerOptions): Promise<Server> {
  const disposableStack = new AsyncDisposableStack();

  const database = await databaseConnect(databaseUrl);

  disposableStack.defer(async () => {
    await database.destroy();
  });

  const fastify = Fastify({
    logger: true,
  });

  // TODO: separate public directories?
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, "../../client/public"),
  });

  fastify.post("/query", async (request, reply) => {
    const bodyResult = QueryRequestBody.decode(request.body);
    if (isLeft(bodyResult)) {
      return reply.code(400);
    }

    const serverQueries = bodyResult.right.queries;

    const {latestIndex, queryResults} = await database.transaction().execute(async transaction => {
      const mutationLogRepository = new MutationLogRepositoryDatabase(transaction);
      const latestIndex = await mutationLogRepository.fetchLatestIndex();
      return {
        latestIndex,
        queryResults: await executeQueries(transaction, serverQueries),
      };
    });

    return QueryResponseBody.encode({
      snapshotIndex: latestIndex,
      results: queryResults,
    });
  });

  const executeQueries = async (
    transaction: Transaction<DB>,
    serverQueries: ReadonlyArray<ServerQuery>
  ) => {
    return await mapSeries(serverQueries, async serverQuery => {
      switch (serverQuery.type) {
        case "card": {
          const cardRepository = new CardRepositoryDatabase(transaction);
          const result = await cardRepository.fetchById(serverQuery.cardId);
          return serializeCardResponse(result);
        }
        case "parentCard": {
          const cardRepository = new CardRepositoryDatabase(transaction);
          const result = await cardRepository.fetchParentByChildId(serverQuery.cardId);
          return serializeParentCardResponse(result);
        }
        case "cardChildCount": {
          const cardRepository = new CardRepositoryDatabase(transaction);
          const result = await cardRepository.fetchChildCountByParentId(serverQuery.cardId);
          return serializeCardChildCountResponse(result);
        }
        case "cardHistory": {
          const cardRepository = new CardRepositoryDatabase(transaction);
          const commentRepository = new CommentRepositoryDatabase(transaction);
          const cardHistoryFetcher = new CardHistoryFetcher(cardRepository, commentRepository);
          const cardHistory = await cardHistoryFetcher.fetchCardHistoryById(serverQuery.cardId);
          return serializeCardHistoryResponse(cardHistory);
        }
        case "searchCards": {
          const cardRepository = new CardRepositoryDatabase(transaction);
          const result = await cardRepository.search(serverQuery.searchTerm);
          return serializeSearchCardsResponse(result);
        }
        case "boardCardTrees": {
          const cardRepository = new CardRepositoryDatabase(transaction);
          const result = await cardRepository.fetchBoardCardTrees(
            serverQuery.boardId,
            new Set(serverQuery.cardStatuses),
          );
          return serializeBoardCardTreesResponse(result);
        }
        case "parentBoard": {
          const cardRepository = new CardRepositoryDatabase(transaction);
          const result = await cardRepository.fetchParentBoard(serverQuery.boardId);
          return serializeParentBoardResponse(result);
        }
        case "allCategories": {
          const categoryRepository = new CategoryRepositoryDatabase(transaction);
          const result = await categoryRepository.fetchAll();
          return serializeAllCategoriesResponse(result);
        }
        case "allColors": {
          return serializeAllColorsResponse(colorSetPresetsOnly.allPresetColors());
        }
        default: {
          handleNever(serverQuery, null);
        }
      }
    });
  };

  fastify.post("/update", async (request, reply) => {
    const bodyResult = UpdateRequestBody.decode(request.body);
    if (isLeft(bodyResult)) {
      return reply.code(400);
    }

    const update = bodyResult.right.update;

    const index = await database.transaction().execute(async transaction => {
      return await mutate(transaction, update.mutation);
    });

    return UpdateResponseBody.encode({
      snapshotIndex: index,
    });
  });

  async function mutate(
    transaction: Transaction<DB>,
    mutation: AppMutation,
  ): Promise<number> {
    const mutationLogRepository = new MutationLogRepositoryDatabase(transaction);
    const index = await mutationLogRepository.add(uuidv7(), mutation);

    await applyMutation(transaction, mutation);

    return index;
  }

  async function applyMutation(
    transaction: Transaction<DB>,
    mutation: AppMutation,
  ): Promise<void> {
    switch (mutation.type) {
      case "cardAdd": {
        const cardRepository = new CardRepositoryDatabase(transaction);
        await cardRepository.add(mutation.cardAdd);
        return;
      }
      case "cardEdit": {
        const cardRepository = new CardRepositoryDatabase(transaction);
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
        const categoryRepository = new CategoryRepositoryDatabase(transaction);
        await categoryRepository.add(mutation.categoryAdd);
        return;
      }
      case "categoryReorder": {
        const categoryRepository = new CategoryRepositoryDatabase(transaction);
        await categoryRepository.reorder(mutation.categoryReorder);
        return;
      }
      case "commentAdd": {
        const commentRepository = new CommentRepositoryDatabase(transaction);
        await commentRepository.add(mutation.commentAdd);
        return;
      }
      case "projectAdd": {
        const projectRepository = new ProjectRepositoryDatabase(transaction);
        await projectRepository.add(mutation.projectAdd);
        return;
      }
      default: {
        return handleNever(mutation, undefined);
      }
    }
  }

  try {
    await fastify.listen({ port });
  } catch (error) {
    fastify.log.error(error);
    throw error;
  }

  disposableStack.defer(async () => {
    await fastify.close();
  });

  return {
    close: async () => {
      await disposableStack.disposeAsync();
    },
    port: () => {
      const address = fastify.addresses()[0];
      if (address === undefined) {
        return null;
      } else {
        return fastify.addresses()[0].port;
      }
    },
  };
}
