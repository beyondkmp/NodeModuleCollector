import { test } from "uvu";
import path from 'path';
import * as assert from "uvu/assert";
import { getNodeModules } from "./src";

interface NodeModuleInfo {
  readonly name: string
  readonly version: string
  dir: string
  dependencies: Array<NodeModuleInfo>
}

function transformToAbsolutePath(p: string) {
  const fs = require('fs');
  let deps: NodeModuleInfo[] = JSON.parse(fs.readFileSync(p, 'utf8'));

  const _transfrom = (deps: NodeModuleInfo[]) => {
    for (let dep of deps) {
      dep.dir = path.resolve(__dirname,dep.dir);
      if (dep.dependencies) {
        _transfrom(dep.dependencies);
      }
    }
  }
  _transfrom(deps);

  return deps;
}

test("test npm package manager", async () => {
  let rootDir = './fixtures/npm-demo';
  let expected = transformToAbsolutePath(path.join(rootDir, 'expected.json'));
  const ms = await getNodeModules(rootDir)
  let a =JSON.stringify(ms, null, 2)
  let b = JSON.stringify(expected, null, 2)
  assert.is(a, b);
});


test.run();