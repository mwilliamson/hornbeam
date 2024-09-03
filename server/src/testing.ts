import path from "node:path";
import { suite } from "mocha";

export function fileSuite(filename: string, callback: () => (Promise<void> | void)) {
  const projectRoot = path.normalize(path.join(__dirname, "../.."));
  suite(path.relative(projectRoot, filename), callback);
}
