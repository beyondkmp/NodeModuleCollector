import { execSync } from "child_process";
import { NodeModulesCollector } from "./nodeModulesCollector"
import { DependencyTree } from "./types"


export class PnpmNodeModulesCollector extends NodeModulesCollector {
  constructor(rootDir: string) {
    super(rootDir);
  }

  getDependenciesTree() {
    const pnpmListOutput = execSync("pnpm list --prod --json --long --depth Infinity", {
      cwd: this.rootDir,
      encoding: "utf-8",
    });

    const dependencyTree: DependencyTree = JSON.parse(pnpmListOutput)[0];
    console.log("pnpm is here",dependencyTree)
    return dependencyTree;
  }
}