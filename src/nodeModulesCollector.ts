import {
  hoist,
  type HoisterTree,
  type HoisterResult,
} from "./hoist";


export abstract class NodeModulesCollector {
  private dependencyPathMap: Map<string, string>;
  private nodeModules: any;
  protected rootDir: string;

  constructor(rootDir: string) {
    this.dependencyPathMap = new Map();
    this.nodeModules = {};
    this.rootDir = rootDir;
  }

  private toTree(obj: any, key: string = `.`, nodes = new Map()): HoisterTree {
    let node = nodes.get(key);
    const name = key.match(/@?[^@]+/)![0];
    if (!node) {
      node = {
        name,
        identName: (obj[key] || {}).identName || name,
        reference: key.match(/@?[^@]+@?(.+)?/)![1] || ``,
        dependencies: new Set<HoisterTree>(),
        peerNames: new Set<string>((obj[key] || {}).peerNames || []),
        dependencyKind: (obj[key] || {}).dependencyKind,
      };
      nodes.set(key, node);

      for (const dep of (obj[key] || {}).dependencies || []) {
        node.dependencies.add(this.toTree(obj, dep, nodes));
      }
    }
    return node;
  }

  private flattenDependencies(tree: any) {
    const result = {
      ".": {},
    };

    const flatten = (node: any, parentKey = ".") => {
      const dependencies = node.dependencies || {};

      for (const [key, value] of Object.entries(dependencies)) {
        const version = (value as any).version || "";
        const newKey = `${key}@${version}`;
        this.dependencyPathMap.set(newKey, (value as any).path);
        if (!result[parentKey]?.dependencies) {
          result[parentKey] = { dependencies: [] };
        }
        result[parentKey].dependencies.push(newKey);
        flatten(value, newKey);
      }
    }

    flatten(tree);
    return result;
  }

  abstract getDependenciesTree():any;

  private _getNodeModules(dependencies: Set<HoisterResult>, result = {}) {
    if (dependencies.size === 0) return;

    for (let d of dependencies.values()) {
      const reference = [...d.references][0];
      const p = this.dependencyPathMap.get(`${d.name}@${reference}`);
      result[d.name] = {
        name: d.name,
        version: reference,
        dir: p
      }
      if (d.dependencies.size > 0) {
        result[d.name].conflicDependencies = {};
        this._getNodeModules(d.dependencies, result[d.name].conflicDependencies);
      }
    }
  }

  public getNodeModules() {
    const tree = this.getDependenciesTree()
    const flattenedTree = this.flattenDependencies(tree);
    const hoisterResult = hoist(this.toTree(flattenedTree), { check: true });
    this._getNodeModules(hoisterResult.dependencies, this.nodeModules);
    return this.nodeModules;
  }

}