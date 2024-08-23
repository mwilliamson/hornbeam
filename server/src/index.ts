import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import {applyAppUpdate, initialAppState} from "hornbeam-common/lib/app";
import {allCategoriesQuery, allColorsQuery, boardCardTreesQuery, cardChildCountQuery, cardQuery, parentCardQuery} from "hornbeam-common/lib/queries";
import {deserializeAppUpdate} from "hornbeam-common/lib/serialization/app";
import {deserializeServerQuery, serializeAllCategoriesResponse, serializeAllColorsResponse, serializeBoardCardTreesResponse, serializeCardChildCountResponse, serializeCardResponse, serializeParentCardResponse} from "hornbeam-common/lib/serialization/serverQueries";
import appStateToQueryFunction from "hornbeam-common/lib/appStateToQueryFunction";
import assertNever from "hornbeam-common/lib/util/assertNever";

export function startServer({port}: {port: number}) {
  const fastify = Fastify({
    logger: true,
  });

  let appState = initialAppState();

  // TODO: separate public directories?
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, "../../client/public"),
  });

  fastify.post("/query", async (request) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serverQuery = deserializeServerQuery((request.body as any).query);

    const executeQuery = appStateToQueryFunction(appState, null);

    switch (serverQuery.type) {
      case "card": {
        const result = await executeQuery(cardQuery(serverQuery.cardId));
        return serializeCardResponse(result);
      }
      case "parentCard": {
        const result = await executeQuery(parentCardQuery(serverQuery.cardId));
        return serializeParentCardResponse(result);
      }
      case "cardChildCount": {
        const result = await executeQuery(cardChildCountQuery(serverQuery.cardId));
        return serializeCardChildCountResponse(result);
      }
      case "boardCardTrees": {
        const result = await executeQuery(boardCardTreesQuery({
          boardId: serverQuery.boardId,
          cardStatuses: new Set(serverQuery.cardStatuses),
        }));
        return serializeBoardCardTreesResponse(result);
      }
      case "allCategories": {
        const result = await executeQuery(allCategoriesQuery);
        return serializeAllCategoriesResponse(result.allCategories());
      }
      case "allColors": {
        const result = await executeQuery(allColorsQuery);
        return serializeAllColorsResponse(result.allPresetColors());
      }
      default: {
        assertNever(serverQuery, null);
      }
    }
  });

  fastify.post("/update", async (request) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = deserializeAppUpdate((request.body as any).update);

    appState = applyAppUpdate(appState, update);

    return {};
  });

  async function run() {
    try {
      await fastify.listen({ port });
    } catch (error) {
      fastify.log.error(error);
      throw error;
    }
  }

  run();
}
