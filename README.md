# NodeModuleCollector

This is a simple tool to collect all production node modules used in a project. It supports npm, yarn1, pnpm and yarn berry(with node-modules).

It is useful to collect all production node modules for a project, so that you can easily to package them into electron asar.

## Design

1. Get node modules tree from "npm list"(npm & yarn) or "pnpm list"
2. Transform the tree to dependency graph
3. Transform the graph to hoisted tree
4. Hoisted tree to node modules array

## Usage

```shell
import { getNodeModules } from 'node-module-collector';
const result = await getNodeModules(rootDir)
```

result is node modules array, like:

```json
[
  {
    "name": "test-app",
    "version": "1.1.0",
    "dir": "fixtures/yarn-workspace-demo/node_modules/test-app",
    "dependencies": [
      {
        "name": "ms",
        "version": "2.1.1",
        "dir": "fixtures/yarn-workspace-demo/packages/test-app/node_modules/ms"
      }
    ]
  },
  {
    "name": "foo",
    "version": "1.0.0",
    "dir": "fixtures/yarn-workspace-demo/node_modules/foo"
  },
  {
    "name": "ms",
    "version": "2.0.0",
    "dir": "fixtures/yarn-workspace-demo/node_modules/ms"
  }
]
```

## Support

[x] npm
[x] pnpm
[x] pnpm with hosited
[x] yarn1
[x] yarn berry(with node-modules)

