import {
  hoist,
  type HoisterTree,
  type HoisterResult,
} from "./hoist";
import path from 'path';
import { NodeModuleInfo, DependencyTree, DependencyGraph } from "./types"

export abstract class NodeModulesCollector {
  private nodeModules: NodeModuleInfo[];
  protected rootDir: string;
  protected dependencyPathMap: Map<string, string>;

  constructor(rootDir: string) {
    this.dependencyPathMap = new Map();
    this.nodeModules = [];
    this.rootDir = rootDir;
  }

  private toTree(obj: DependencyGraph, key: string = `.`, nodes: Map<string, HoisterTree> = new Map()): HoisterTree {
    let node = nodes.get(key);
    const name = key.match(/@?[^@]+/)![0];
    if (!node) {
      node = {
        name,
        identName: name,
        reference: key.match(/@?[^@]+@?(.+)?/)![1] || ``,
        dependencies: new Set<HoisterTree>(),
        peerNames: new Set<string>([])
      };
      nodes.set(key, node);

      for (const dep of (obj[key] || {}).dependencies || []) {
        node.dependencies.add(this.toTree(obj, dep, nodes));
      }
    }
    return node;
  }

  public TransToDependencyGraph(tree: DependencyTree): DependencyGraph {
    const result: DependencyGraph = { ".": {} };

    const flatten = (node: DependencyTree, parentKey = ".") => {
      const dependencies = node.dependencies || {};

      for (const [key, value] of Object.entries(dependencies)) {
        const version = value.version || "";
        const newKey = `${key}@${version}`;
        this.dependencyPathMap.set(newKey, path.normalize(value.path));
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

  abstract getDependenciesTree(): DependencyTree;

  private _getNodeModules(dependencies: Set<HoisterResult>, result: NodeModuleInfo[]) {
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

  public getNodeModules():NodeModuleInfo[] {
    const tree = this.getDependenciesTree()
    const flattenedTree = this.TransToDependencyGraph(tree);
    const hoisterResult = hoist(this.toTree(flattenedTree), { check: true });
    this._getNodeModules(hoisterResult.dependencies, this.nodeModules);
    return this.nodeModules;
  }
}