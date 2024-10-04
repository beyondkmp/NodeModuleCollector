import { test } from "uvu";
import path from 'path';
import fs from 'fs';
import * as assert from "uvu/assert";
import { getNodeModules } from "./src";

interface NodeModuleInfo {
  readonly name: string
  readonly version: string
  dir: string
  dependencies: Array<NodeModuleInfo>
}

function transformToRelativePath(deps: NodeModuleInfo[]) {
    for (let dep of deps) {
      dep.dir = path.relative(__dirname, dep.dir).split(path.sep).join('/')
      if (dep.dependencies) {
        transformToRelativePath(dep.dependencies);
      }
    }
}

test("test npm package manager", async () => {
  let rootDir = './fixtures/npm-demo'
  let expectedPath = path.join(rootDir, 'expected.json')
  let expected:NodeModuleInfo = JSON.parse(fs.readFileSync(expectedPath, 'utf8'))

  const result = await getNodeModules(rootDir)
  transformToRelativePath(result)

  assert.equal(result, expected);
});

test("test pnpm package manager", async () => {
  let rootDir = './fixtures/pnpm-demo'
  let expectedPath = path.join(rootDir, 'expected.json')
  let expected:NodeModuleInfo = JSON.parse(fs.readFileSync(expectedPath, 'utf8'))

  const result = await getNodeModules(rootDir)
  transformToRelativePath(result)

  assert.equal(result, expected);
});

test("test yarn1 package manager", async () => {
  let rootDir = './fixtures/yarn-demo'
  let expectedPath = path.join(rootDir, 'expected.json')
  let expected:NodeModuleInfo = JSON.parse(fs.readFileSync(expectedPath, 'utf8'))

  const result = await getNodeModules(rootDir)
  transformToRelativePath(result)

  assert.equal(result, expected);
});

test.run();