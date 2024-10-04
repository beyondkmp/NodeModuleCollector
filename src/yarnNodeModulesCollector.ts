import { execSync } from "child_process";
import path from "path";
import { NodeModulesCollector } from "./nodeModulesCollector"
import { DependencyTree } from "./types"


export class YarnNodeModulesCollector extends NodeModulesCollector {
  constructor(rootDir: string) {
    super(rootDir);
  }

  getDependenciesTree() {
    const npmListOutput = execSync("npm list --omit dev -a --json --long", {
      cwd: this.rootDir,
      encoding: "utf-8",
    });

    const dependencyTree:DependencyTree = JSON.parse(npmListOutput);

    if (dependencyTree.workspaces) {
      for (const [key, value] of Object.entries(dependencyTree.dependencies)) {
        if(this.rootDir.endsWith(path.normalize(key))) {
          return value
        } 
      }
    }

    return dependencyTree;
  }
}