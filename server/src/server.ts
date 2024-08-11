import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import {initialAppState} from "hornbeam-common/lib/app";
import {cardChildCountQuery, cardQuery, parentCardQuery} from "hornbeam-common/lib/queries";
import {deserializeServerQuery, serializeCardChildCountResponse, serializeCardResponse, serializeParentCardResponse} from "hornbeam-common/lib/serialization/serverQueries";
import appStateToQueryFunction from "hornbeam-common/lib/appStateToQueryFunction";

const fastify = Fastify({
  logger: true,
});

const appState = initialAppState();

// TODO: separate public directories?
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "../../client/public"),
});

fastify.post("/query", async (request, response) => {
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
  }
})

async function run() {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

run();
