const fs = require('fs');
const path = require('path');

function findDependencyPath(basePath, dependencyName) {
  let currentPath = basePath;
  while (currentPath !== path.parse(currentPath).root) {
    const dependencyPath = path.join(currentPath, 'node_modules', dependencyName);
    if (fs.existsSync(dependencyPath)) {
      return dependencyPath;
    }
    currentPath = path.dirname(currentPath);
  }
  return null;
}

function getDependenciesFromPackageJson(packageJsonPath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
  } catch (error) {
    console.error(`Error reading ${packageJsonPath}:`, error);
    return {};
  }
}

function getPackageVersion(packagePath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error(`Error reading package.json in ${packagePath}:`, error);
    return 'unknown';
  }
}

function findAllDependencyPaths(basePath, seen = new Map()) {
  const dependencies = getDependenciesFromPackageJson(path.join(basePath, 'package.json'));
  const results = new Map();

  for (const [name, declaredVersion] of Object.entries(dependencies)) {
	  console.log("test is here", name)
    const dependencyPath = findDependencyPath(basePath, name);
    if (dependencyPath) {
      const actualVersion = getPackageVersion(dependencyPath);
      const key = `${name}@${actualVersion}`;
      
      if (!results.has(key)) {
        results.set(key, []);
      }
      results.get(key).push(dependencyPath);

      if (!seen.has(key)) {
        seen.set(key, true);
        // 递归查找这个依赖的依赖
        const nestedDependencies = findAllDependencyPaths(dependencyPath, seen);
        for (const [nestedKey, nestedPaths] of nestedDependencies) {
          if (!results.has(nestedKey)) {
            results.set(nestedKey, []);
          }
          results.get(nestedKey).push(...nestedPaths);
        }
      }
    } else {
      console.log(`${name}@${declaredVersion}: Not found`);
    }
  }

  return results;
}

function printDependencyTree(dependencies) {
  for (const [key, paths] of dependencies) {
    console.log(`${key}:`);
    paths.forEach(p => console.log(`  - ${p}`));
  }
}

// 主函数
function main(projectPath) {
  console.log(`Analyzing dependencies for project: ${projectPath}\n`);
  const allDependencies = findAllDependencyPaths(projectPath);
  printDependencyTree(allDependencies);
}

// 使用示例
const projectPath = process.argv[2] || '.';
main(projectPath);
