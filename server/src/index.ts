import "disposablestack/auto";
import { isLeft } from "fp-ts/lib/Either";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { QueryRequestBody, QueryResponseBody, UpdateRequestBody, UpdateResponseBody } from "hornbeam-common/lib/serialization/serverApi";
import { databaseConnect } from "./database";
import { App } from "./app";

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

  const app = new App(database);

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

    const app = new App(database);

    const {latestIndex, queryResults} = await app.transaction(async transaction => {
      return await transaction.query(serverQueries);
    });

    return QueryResponseBody.encode({
      snapshotIndex: latestIndex,
      results: queryResults,
    });
  });

  fastify.post("/update", async (request, reply) => {
    const bodyResult = UpdateRequestBody.decode(request.body);
    if (isLeft(bodyResult)) {
      return reply.code(400);
    }

    const update = bodyResult.right.update;

    const index = await app.transaction(async transaction => {
      return await transaction.mutate(update.mutation);
    });

    return UpdateResponseBody.encode({
      snapshotIndex: index,
    });
  });

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
