import { execSync } from "child_process";
import { NodeModulesCollector } from "./nodeModulesCollector"
import { DependencyTree } from "./types"


export class PnpmNodeModulesCollector extends NodeModulesCollector {
  constructor(rootDir: string) {
    super(rootDir);
  }

  getDependenciesTree() {
    const npmListOutput = execSync("pnpm list --prod -a --json --long  --depth Infinity", {
      cwd: this.rootDir,
      encoding: "utf-8",
    });

    const dependencyTree:DependencyTree = JSON.parse(npmListOutput)[0];
    return dependencyTree;
  }
}