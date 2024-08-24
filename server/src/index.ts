import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import {applyAppUpdate, initialAppState} from "hornbeam-common/lib/app";
import {allCategoriesQuery, allColorsQuery, boardCardTreesQuery, cardChildCountQuery, cardQuery, parentCardQuery} from "hornbeam-common/lib/queries";
import {deserializeAppUpdate} from "hornbeam-common/lib/serialization/app";
import {deserializeServerQuery, serializeAllCategoriesResponse, serializeAllColorsResponse, serializeBoardCardTreesResponse, serializeCardChildCountResponse, serializeCardResponse, serializeParentCardResponse} from "hornbeam-common/lib/serialization/serverQueries";
import appStateToQueryFunction from "hornbeam-common/lib/appStateToQueryFunction";
import assertNever from "hornbeam-common/lib/util/assertNever";

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
        case "boardCardTrees": {
          const result = executeQuery(boardCardTreesQuery({
            boardId: serverQuery.boardId,
            cardStatuses: new Set(serverQuery.cardStatuses),
          }));
          return serializeBoardCardTreesResponse(result);
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
          assertNever(serverQuery, null);
        }
      }
    });
  });

  fastify.post("/update", async (request) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = deserializeAppUpdate((request.body as any).update);

    appState = applyAppUpdate(appState, update);

    return {};
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
