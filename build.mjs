import * as esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import fs from "fs/promises";
import util from "util";

const args = util.parseArgs({
  options: {
    watch: {
      type: "boolean",
    }
  },
  strict: true,
});

await fs.cp("node_modules/@fontsource-variable/source-sans-3/files", "public/fonts", {recursive: true});

const context = await esbuild.context({
  entryPoints: ["src/client.tsx", "src/demo.tsx", "src/cosmos.tsx"],
  bundle: true,
  outdir: "public/",
  metafile: true,
  mainFields: ["module", "browser", "main"],
  plugins: [
    {
      name: "woff2",
      setup(build) {
        build.onResolve({filter: /\/source-sans-3-.*\.woff2$/}, ({path, resolveDir}) => {
          const result = /\/(source-sans-3-.*\.woff2)$/.exec(path);
          const name = result[1];
          return {path: `/fonts/${name}`, external: true, namespace: "provided"};
        });
      }
    },
    sassPlugin(),
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
