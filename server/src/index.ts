import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import {applyAppUpdate, initialAppState} from "hornbeam-common/lib/app";
import {allCategoriesQuery, allColorsQuery, boardCardTreesQuery, cardChildCountQuery, cardHistoryQuery, cardQuery, parentBoardQuery, parentCardQuery, searchCardsQuery} from "hornbeam-common/lib/queries";
import {deserializeAppUpdate} from "hornbeam-common/lib/serialization/app";
import {deserializeServerQuery, serializeAllCategoriesResponse, serializeAllColorsResponse, serializeBoardCardTreesResponse, serializeCardChildCountResponse, serializeCardHistoryResponse, serializeCardResponse, serializeParentBoardResponse, serializeParentCardResponse, serializeSearchCardsResponse, serializeUpdateResponse} from "hornbeam-common/lib/serialization/serverQueries";
import appStateToQueryFunction from "hornbeam-common/lib/appStateToQueryFunction";
import { assertNeverWithDefault } from "hornbeam-common/lib/util/assertNever";

interface Server {
  close: () => Promise<void>;
  port: () => number | null;
}

export async function startServer({port}: {port: number}): Promise<Server> {
  const fastify = Fastify({
    logger: true,
  });

  let appState = initialAppState();

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

    return serverQueries.map(serverQuery => {
      const executeQuery = appStateToQueryFunction(appState, null);

      switch (serverQuery.type) {
        case "card": {
          const result = executeQuery(cardQuery(serverQuery.cardId));
          return serializeCardResponse(result);
        }
        case "parentCard": {
          const result = executeQuery(parentCardQuery(serverQuery.cardId));
          return serializeParentCardResponse(result);
        }
        case "cardChildCount": {
          const result = executeQuery(cardChildCountQuery(serverQuery.cardId));
          return serializeCardChildCountResponse(result);
        }
        case "cardHistory": {
          const result = executeQuery(cardHistoryQuery(serverQuery.cardId));
          return serializeCardHistoryResponse(result);
        }
        case "searchCards": {
          const result = executeQuery(searchCardsQuery(serverQuery.searchTerm));
          return serializeSearchCardsResponse(result);
        }
        case "boardCardTrees": {
          const result = executeQuery(boardCardTreesQuery({
            boardId: serverQuery.boardId,
            cardStatuses: new Set(serverQuery.cardStatuses),
          }));
          return serializeBoardCardTreesResponse(result);
        }
        case "parentBoard": {
          const result = executeQuery(parentBoardQuery(serverQuery.boardId));
          return serializeParentBoardResponse(result);
        }
        case "allCategories": {
          const result = executeQuery(allCategoriesQuery);
          return serializeAllCategoriesResponse(result.allCategories());
        }
        case "allColors": {
          const result = executeQuery(allColorsQuery);
          return serializeAllColorsResponse(result.allPresetColors());
        }
        default: {
          assertNeverWithDefault(serverQuery, null);
        }
      }
    });
  });

  fastify.post("/update", async (request) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = deserializeAppUpdate((request.body as any).update);

    appState = applyAppUpdate(appState, update);

    return serializeUpdateResponse({
      snapshotIndex: appState.latestSnapshotIndex(),
    });
  });

  try {
    await fastify.listen({ port });
  } catch (error) {
    fastify.log.error(error);
    throw error;
  }

  return {
    close: async () => {
      await fastify.close();
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
