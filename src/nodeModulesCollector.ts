import {
  hoist,
  type HoisterTree,
  type HoisterResult,
} from "./hoist";
import path from 'path';


export abstract class NodeModulesCollector {
  private nodeModules: any;
  protected rootDir: string;
  protected dependencyPathMap: Map<string, string>;

  constructor(rootDir: string) {
    this.dependencyPathMap = new Map();
    this.nodeModules = [];
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

  public flattenDependencies(tree: any) {
    const result = {
      ".": {},
    };

    const flatten = (node: any, parentKey = ".") => {
      const dependencies = node.dependencies || {};

      for (const [key, value] of Object.entries(dependencies)) {
        const version = (value as any).version || "";
        const newKey = `${key}@${version}`;
        this.dependencyPathMap.set(newKey, path.normalize((value as any).path));
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

  private _getNodeModules(dependencies: Set<HoisterResult>, result = []) {
    if (dependencies.size === 0) return;

    for (let d of dependencies.values()) {
      const reference = [...d.references][0];
      const p = this.dependencyPathMap.get(`${d.name}@${reference}`);
      let node = {
        name: d.name,
        version: reference,
        dir: p
      };
      result.push(node)
      if (d.dependencies.size > 0) {
        node['dependencies'] = [];
        this._getNodeModules(d.dependencies, node['dependencies']);
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