export interface NodeModuleInfo {
  readonly name: string
  readonly version: string
  readonly dir: string
  readonly dependencies?: Array<NodeModuleInfo>
}

export interface DependencyTree {
  readonly version?: string
  readonly name?: string
  readonly from?: string
  readonly workspaces?: string[]
  readonly path:string
  dependencies: {
    [packageName: string]: DependencyTree
  }
}

export interface DependencyGraph {
  [packageNameAndVersion: string]: PackageDependencies
}

interface PackageDependencies {
  dependencies?: string[]
}