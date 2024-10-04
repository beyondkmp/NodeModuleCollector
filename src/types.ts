export interface NodeModuleInfo {
  readonly name: string
  readonly version: string
  readonly dir: string
  readonly dependencies: Array<NodeModuleInfo>
}

export interface DependencyTree {
  version: string
  name: string
  path:string
  dependencies: {
    [packageName: string]: DependencyTree
  };
}