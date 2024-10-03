import {
  hoist,
  HoisterDependencyKind,
  type HoisterTree,
  type HoisterResult,
} from "./hoist";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

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

function processDependencies(
  dependencies,
  currentPath = process.cwd(),
  depth = 0
) {
  if (!dependencies) return;

  Object.keys(dependencies).forEach((name) => {
    const module = dependencies[name];

    if (module.path) {
      const relativePath = path.relative(process.cwd(), module.path);
      console.log(
        "  ".repeat(depth) + `${name}@${module.version} -> ${relativePath}`
      );
    } else {
      console.log("  ".repeat(depth) + `${name}@${module.version} -> 路径未知`);
    }

    const packageJsonPath = path.join(module.path || "", "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = require(packageJsonPath);
      if (packageJson.version !== module.version) {
        console.log(
          "  ".repeat(depth) +
            `  警告: package.json 版本 (${packageJson.version}) 与依赖树版本不匹配`
        );
      }
    }

    // 递归处理子依赖
    processDependencies(module.dependencies, module.path, depth + 1);
  });
}

processDependencies(dependencyTree.dependencies);

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

//  console.log(JSON.stringify(flattenDependencies(tree)));

const h = hoist(toTree(flattenDependencies(dependencyTree)), { check: true });

for (let d of h.dependencies.values()) {
	console.log(d.name, [...d.references][0])
	for (let c of d.dependencies.values()){
	    console.log('    child',c.name, [...c.references][0])
	}
}