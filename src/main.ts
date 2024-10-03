import {
  hoist,
  type HoisterTree,
  type HoisterResult,
} from "./hoist";
import { execSync } from "child_process";

function toTree(obj: any, key: string = `.`, nodes = new Map()): HoisterTree {
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
      node.dependencies.add(toTree(obj, dep, nodes));
    }
  }
  return node;
}

const npmListOutput = execSync("npm list --omit dev -a --json --long", {
  cwd: "./tests/tar-demo/",
  encoding: "utf-8",
});

const dependencyTree = JSON.parse(npmListOutput);
const dependencyPathMap = new Map<string, string>();

function flattenDependencies(tree) {
  const result = {
    ".": {
      dependencies: [],
    },
  };

  function flatten(node: any, parentKey = ".") {
    const dependencies = node.dependencies || {};

    for (const [key, value] of Object.entries(dependencies)) {
      const version = (value as any).version || "";
      const newKey = `${key}@${version}`;
      dependencyPathMap.set(newKey, (value as any).path);

      if (parentKey === ".") {
        result["."].dependencies.push(newKey);
      } else {
        if (!result[parentKey]) {
          result[parentKey] = { dependencies: [] };
        }
        result[parentKey].dependencies.push(newKey);
      }

      if (!result[newKey]) {
        result[newKey] = { dependencies: [] };
      }

      flatten(value, newKey);
    }
  }

  flatten(tree);
  return result;
}

const h = hoist(toTree(flattenDependencies(dependencyTree)), { check: true });

function getNodeModules(dependencies: Set<HoisterResult>, result = {}) {  
  if(dependencies.size === 0) return;

  for (let d of dependencies.values()) {
    const reference = [...d.references][0];
    const p = dependencyPathMap.get(`${d.name}@${reference}`);
    result[d.name] = {
      name:d.name,
      version: reference,
      dir: p
    }
    if(d.dependencies.size > 0){
      result[d.name].conflicDependencies = {};
      getNodeModules(d.dependencies, result[d.name].conflicDependencies);
    }
  }
}

let result = {};
getNodeModules(h.dependencies, result);

console.log(JSON.stringify(result, null, 2));