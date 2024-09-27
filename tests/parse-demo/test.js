const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 执行 yarn list 命令获取依赖树
const yarnListOutput = execSync('yarn list --depth=10 --json', { encoding: 'utf-8' });
const dependencyTree = JSON.parse(yarnListOutput);

// 获取模块路径的函数
function getModulePath(name, version) {
  try {
    // 尝试解析模块的主文件
    const modulePath = require.resolve(name, { paths: [process.cwd()] });
    // 获取包含 package.json 的目录
    const packageDir = path.dirname(modulePath);
    const packageJsonPath = path.join(packageDir, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = require(packageJsonPath);
      if (packageJson.version === version) {
        return packageDir;
      }
    }
    
    // 如果版本不匹配，尝试在 node_modules 中查找
    const possiblePath = path.join(process.cwd(), 'node_modules', name);
    if (fs.existsSync(possiblePath)) {
      const packageJson = require(path.join(possiblePath, 'package.json'));
      if (packageJson.version === version) {
        return possiblePath;
      }
    }
  } catch (error) {
    // 模块无法解析
  }
  return null;
}

// 递归函数来处理依赖树
function processDependencies(trees, depth = 0) {
  if (!trees || !Array.isArray(trees)) return;

  trees.forEach(tree => {
    const name = tree.name;
    const version = tree.version;
    const modulePath = getModulePath(name, version);

    if (modulePath) {
      const relativePath = path.relative(process.cwd(), modulePath);
      console.log('  '.repeat(depth) + `${name}@${version} -> ${relativePath}`);
    } else {
      console.log('  '.repeat(depth) + `${name}@${version} -> 路径未知`);
    }

    // 递归处理子依赖
    processDependencies(tree.children, depth + 1);
  });
}

// 开始处理依赖树
processDependencies(dependencyTree.data.trees);
