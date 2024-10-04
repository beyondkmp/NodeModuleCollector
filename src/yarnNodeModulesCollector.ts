import { execSync } from "child_process";
import { NodeModulesCollector } from "./nodeModulesCollector"


export class YarnNodeModulesCollector extends NodeModulesCollector {
  constructor(rootDir: string) {
    super(rootDir);
  }

  getDependenciesTree() {
    const npmListOutput = execSync("npm list --omit dev -a --json --long", {
      cwd: this.rootDir,
      encoding: "utf-8",
    });

    const dependencyTree = JSON.parse(npmListOutput);
    return dependencyTree;
  }
}