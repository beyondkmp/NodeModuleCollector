import {
  hoist,
  HoisterDependencyKind,
  type HoisterTree,
  type HoisterResult,
} from "@yarnpkg/nm";
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

const npmListOutput = execSync('npm list --omit dev -a --json --long', { encoding: 'utf-8' });
const dependencyTree = JSON.parse(npmListOutput);

function processDependencies(dependencies, currentPath = process.cwd(), depth = 0) {
  if (!dependencies) return;

  Object.keys(dependencies).forEach(name => {
    const module = dependencies[name];
    
    // 使用 npm list 提供的路径信息
    if (module.path) {
      const relativePath = path.relative(process.cwd(), module.path);
      console.log('  '.repeat(depth) + `${name}@${module.version} -> ${relativePath}`);
    } else {
      console.log('  '.repeat(depth) + `${name}@${module.version} -> 路径未知`);
    }

    // 检查是否存在 package.json 来验证路径
    const packageJsonPath = path.join(module.path || '', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = require(packageJsonPath);
      if (packageJson.version !== module.version) {
        console.log('  '.repeat(depth) + `  警告: package.json 版本 (${packageJson.version}) 与依赖树版本不匹配`);
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

const d = h.dependencies;
// console.log(d);
d.forEach((dep) => {
  console.log(dep.name, dep.references);
  if (dep.dependencies.size > 0) {
    dep.dependencies.forEach((dep) => {
      console.log(`  ${dep.name}, ${dep.references}`);
    });
  }
});
//console.log(JSON.stringify(h));

//  const tree = {
//        '.': {dependencies: [`A`, `C@Y`, `D@Y`]},
//        A: {dependencies: [`B`, `C@Z`, `F@Z`]},
//        B: {dependencies: [`C@X`, `F@X`]},
//        'F@X': {dependencies: [`G@X`]},
//        'C@X': {dependencies: [`D@X`]},
//      };

// console.log(JSON.stringify(tree));
// const h = hoist(toTree(tree), {check: true})

// console.log(h);%
