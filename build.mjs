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
        build.onResolve({filter: /fonts\/.*woff2$/}, ({path}) => {
          return {path, external: true, namespace: "provided"};
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
