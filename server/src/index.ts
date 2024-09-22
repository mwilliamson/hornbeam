import "disposablestack/auto";
import mapSeries from "p-map-series";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import {deserializeAppUpdate} from "hornbeam-common/lib/serialization/app";
import {deserializeServerQuery, serializeAllCategoriesResponse, serializeAllColorsResponse, serializeBoardCardTreesResponse, serializeCardChildCountResponse, serializeCardHistoryResponse, serializeCardResponse, serializeParentBoardResponse, serializeParentCardResponse, serializeSearchCardsResponse, serializeUpdateResponse} from "hornbeam-common/lib/serialization/serverQueries";
import { handleNever } from "hornbeam-common/lib/util/assertNever";
import { databaseConnect } from "./database";
import { CardRepositoryDatabase } from "./repositories/cards";
import { CategoryRepositoryDatabase } from "./repositories/categories";
import { colorSetPresetsOnly } from "hornbeam-common/lib/app/colors";
import { ProjectContentsMutation } from "hornbeam-common/lib/app/snapshots";

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

  fastify.post("/query", async (request) => {
    // TODO: handle invalid request body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedServerQueries: ReadonlyArray<unknown> = ((request.body as any).queries);
    const serverQueries = serializedServerQueries.map(
      serializedServerQuery => deserializeServerQuery(serializedServerQuery),
    );

    return mapSeries(serverQueries, async serverQuery => {
      switch (serverQuery.type) {
        case "card": {
          const cardRepository = new CardRepositoryDatabase(database);
          const result = await cardRepository.fetchById(serverQuery.cardId);
          return serializeCardResponse(result);
        }
        case "parentCard": {
          const cardRepository = new CardRepositoryDatabase(database);
          const result = await cardRepository.fetchParentByChildId(serverQuery.cardId);
          return serializeParentCardResponse(result);
        }
        case "cardChildCount": {
          const cardRepository = new CardRepositoryDatabase(database);
          const result = await cardRepository.fetchChildCountByParentId(serverQuery.cardId);
          return serializeCardChildCountResponse(result);
        }
        case "cardHistory": {
          // TODO: implement card history
          return serializeCardHistoryResponse([]);
        }
        case "searchCards": {
          const cardRepository = new CardRepositoryDatabase(database);
          const result = await cardRepository.search(serverQuery.searchTerm);
          return serializeSearchCardsResponse(result);
        }
        case "boardCardTrees": {
          const cardRepository = new CardRepositoryDatabase(database);
          const result = await cardRepository.fetchBoardCardTrees(
            serverQuery.boardId,
            new Set(serverQuery.cardStatuses),
          );
          return serializeBoardCardTreesResponse(result);
        }
        case "parentBoard": {
          const cardRepository = new CardRepositoryDatabase(database);
          const result = await cardRepository.fetchParentBoard(serverQuery.boardId);
          return serializeParentBoardResponse(result);
        }
        case "allCategories": {
          const categoryRepository = new CategoryRepositoryDatabase(database);
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
  });

  fastify.post("/update", async (request) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = deserializeAppUpdate((request.body as any).update);

    await mutate(update.mutation);

    return serializeUpdateResponse({
      // TODO: proper snapshot index
      snapshotIndex: 0,
    });
  });

  async function mutate(mutation: ProjectContentsMutation): Promise<void> {
    switch (mutation.type) {
      case "cardAdd": {
        const cardRepository = new CardRepositoryDatabase(database);
        await cardRepository.add(mutation.cardAdd);
        return;
      }
      case "cardEdit": {
        const cardRepository = new CardRepositoryDatabase(database);
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
        const categoryRepository = new CategoryRepositoryDatabase(database);
        await categoryRepository.add(mutation.categoryAdd);
        return;
      }
      case "categoryReorder": {
        const categoryRepository = new CategoryRepositoryDatabase(database);
        await categoryRepository.reorder(mutation.categoryReorder);
        return;
      }
      case "commentAdd": {
        throw new Error("commentAdd not supported");
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
