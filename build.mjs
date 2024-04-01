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
  entryPoints: ["src/client.tsx", "src/demo.tsx"],
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
  ],
});

await context.rebuild();

if (args.values.watch) {
  console.log("Watching");
  await context.watch();
} else {
  context.dispose();
}
