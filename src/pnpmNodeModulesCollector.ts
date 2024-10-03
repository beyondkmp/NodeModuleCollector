import { execSync } from "child_process";
import {NodeModulesCollector} from "./nodeModulesCollector"


export class PnpmNodeModulesCollector extends NodeModulesCollector {
	constructor(rootDir: string) {
    super(rootDir);
	}

 getDependenciesTree() {
		const npmListOutput = execSync("pnpm list --prod -a --json --long  --depth Infinity", {
			cwd: this.rootDir,
			encoding: "utf-8",
		});

		const dependencyTree = JSON.parse(npmListOutput);
		return dependencyTree[0];
	}
}