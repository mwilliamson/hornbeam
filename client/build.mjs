import * as esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import fs from "fs/promises";
import path from "path";
import url from "url";
import util from "util";

const args = util.parseArgs({
  options: {
    cosmos: {
      type: "boolean",
    },
    watch: {
      type: "boolean",
    }
  },
  strict: true,
});

await fs.cp("node_modules/@fontsource-variable/source-sans-3/files", "public/fonts", {recursive: true});

const entryPoints = ["src/simpleSyncClient.tsx", "src/demo.tsx"];

if (args.values.cosmos) {
  entryPoints.push("src/cosmos.tsx");
}

const context = await esbuild.context({
  entryPoints,
  bundle: true,
  outdir: "public/",
  metafile: true,
  mainFields: ["module", "browser", "main"],
  plugins: [
    {
      name: "woff2",
      setup(build) {
        build.onResolve({filter: /\/source-sans-3-.*\.woff2$/}, (args) => {
          const result = /\/(source-sans-3-.*\.woff2)$/.exec(args.path);
          const name = result[1];
          return {path: `./fonts/${name}`, external: true, namespace: "provided"};
        });
      }
    },
    sassPlugin(),
    {
      name: "hornbeam-log",
      setup(build) {
        build.onResolve({filter: /hornbeam\.log$/}, (args) => {
          const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
          const hornbeamLogPath = path.join(__dirname, "../hornbeam.log");
          const resolvedPath = path.join(args.resolveDir, args.path);
          const isHornbeamLogPath = path.relative(resolvedPath, hornbeamLogPath) === "";

          return isHornbeamLogPath ? {path: hornbeamLogPath, namespace: "hornbeam-log"} : undefined;
        });

        build.onLoad({filter: /.*/, namespace: "hornbeam-log"}, async (args) => {
          const eventLogFile = await fs.open(args.path, "r");
          const messages = [];
          for await (const line of eventLogFile.readLines({encoding: "utf-8", start: 0, autoClose: true})) {
              const message = JSON.parse(line);
              messages.push(message);
          }

          return {
            contents: `export default ${JSON.stringify(messages)};`
          };
        });
      }
    },
    {
      name: "progress",
      setup(build) {
        build.onStart(() => {
          console.log("Starting build...");
        });

        build.onEnd(async (result) => {
          console.log(`Build finished with ${result.errors.length} errors`);
          if (result.metafile !== undefined) {
            await fs.writeFile("build.json", JSON.stringify(result.metafile));
          }
        })
      }
    }
  ],
});

if (args.values.watch) {
  console.log("Watching");
  await context.watch();
} else {
  await context.rebuild();
  context.dispose();
}
