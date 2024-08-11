import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";

const fastify = Fastify({
  logger: true,
});

// TODO: separate public directories?
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "../../client/public"),
});

async function run() {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

run();
