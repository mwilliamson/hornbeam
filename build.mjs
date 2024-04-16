import * as esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
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

        build.onEnd(result => {
          console.log(`Build finished with ${result.errors.length} errors`);
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
