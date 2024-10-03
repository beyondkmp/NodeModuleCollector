import {NpmNodeModulesCollector} from "./npmNodeModulesCollector"
import {PnpmNodeModulesCollector} from "./pnpmNodeModulesCollector"
import {YarnNodeModulesCollector} from "./yarnNodeModulesCollector"
import {detect} from "detect-package-manager"

async function getCollectorByPackageManager() {
  const manager = await detect()
  switch(manager) {
    case "npm":
      return NpmNodeModulesCollector
    case "pnpm":
      return PnpmNodeModulesCollector
    case "yarn":
      return YarnNodeModulesCollector
    default:
      return NpmNodeModulesCollector
  }
}

export async function getNodeModules(rootDir: string) {
  const Collector = await getCollectorByPackageManager()
  const collector = new Collector(rootDir)
  return collector.getNodeModules()
}

// let collector = new NpmNodeModulesCollector("./tests/tar-demo");
// let result = collector.getNodeModules()
// console.log(JSON.stringify(result, null, 2));

// collector = new PnpmNodeModulesCollector("./tests/es5-demo");
// result = collector.getNodeModules()
// console.log(JSON.stringify(result, null, 2));

// collector = new YarnNodeModulesCollector("./tests/yarn-demo");
// result = collector.getNodeModules()
// console.log(JSON.stringify(result, null, 2));