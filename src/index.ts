import { NpmNodeModulesCollector } from "./npmNodeModulesCollector"
import { PnpmNodeModulesCollector } from "./pnpmNodeModulesCollector"
import { YarnNodeModulesCollector } from "./yarnNodeModulesCollector"
import { detect, PM } from "./packageManager"

async function getCollectorByPackageManager(rootDir: string) {
  const manager: PM = await detect({ cwd: rootDir })
  switch (manager) {
    case "npm":
      return new NpmNodeModulesCollector(rootDir)
    case "pnpm":
      return new PnpmNodeModulesCollector(rootDir)
    case "yarn":
      return new YarnNodeModulesCollector(rootDir)
    default:
      console.debug(`Unsupported package manager: ${manager}`)
      return undefined;
  }
}

export interface NodeModuleInfo {
  readonly name: string
  readonly version: string
  readonly dir: string
  readonly dependencies: Array<NodeModuleInfo>
}

export async function getNodeModules(rootDir: string): Promise<NodeModuleInfo[]> {
  const collector = await getCollectorByPackageManager(rootDir)
  if (collector) {
    return collector.getNodeModules()
  }
}