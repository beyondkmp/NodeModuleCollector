import { hoist , HoisterDependencyKind, type HoisterTree, type HoisterResult } from '@yarnpkg/nm'

const toTree = (obj: any, key: string = `.`, nodes = new Map()): HoisterTree => {
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

    for (const dep of ((obj[key] || {}).dependencies || [])) {
      node.dependencies.add(toTree(obj, dep, nodes));
    }
  }
  return node;
};

const treeString = `
{
  "version": "1.0.0",
  "name": "TestApp",
  "dependencies": {
    "es5-ext": {
      "version": "0.10.53",
      "resolved": "https://registry.npmjs.org/es5-ext/-/es5-ext-0.10.53.tgz",
      "overridden": false,
      "dependencies": {
        "es6-iterator": {
          "version": "2.0.3",
          "resolved": "https://registry.npmjs.org/es6-iterator/-/es6-iterator-2.0.3.tgz",
          "overridden": false,
          "dependencies": {
            "d": {
              "version": "1.0.2",
              "resolved": "https://registry.npmjs.org/d/-/d-1.0.2.tgz",
              "overridden": false,
              "dependencies": {
                "es5-ext": {
                  "version": "0.10.64",
                  "resolved": "https://registry.npmjs.org/es5-ext/-/es5-ext-0.10.64.tgz",
                  "overridden": false,
                  "dependencies": {
                    "es6-iterator": {
                      "version": "2.0.3"
                    },
                    "es6-symbol": {
                      "version": "3.1.4"
                    },
                    "esniff": {
                      "version": "2.0.1",
                      "resolved": "https://registry.npmjs.org/esniff/-/esniff-2.0.1.tgz",
                      "overridden": false,
                      "dependencies": {
                        "d": {
                          "version": "1.0.2"
                        },
                        "es5-ext": {
                          "version": "0.10.64",
                          "resolved": "https://registry.npmjs.org/es5-ext/-/es5-ext-0.10.64.tgz",
                          "overridden": false,
                          "dependencies": {
                            "es6-iterator": {
                              "version": "2.0.3"
                            },
                            "es6-symbol": {
                              "version": "3.1.4"
                            },
                            "esniff": {
                              "version": "2.0.1"
                            },
                            "next-tick": {
                              "version": "1.1.0",
                              "resolved": "https://registry.npmjs.org/next-tick/-/next-tick-1.1.0.tgz",
                              "overridden": false
                            }
                          }
                        },
                        "event-emitter": {
                          "version": "0.3.5",
                          "resolved": "https://registry.npmjs.org/event-emitter/-/event-emitter-0.3.5.tgz",        
                          "overridden": false,
                          "dependencies": {
                            "d": {
                              "version": "1.0.2"
                            },
                            "es5-ext": {
                              "version": "0.10.53"
                            }
                          }
                        },
                        "type": {
                          "version": "2.7.3"
                        }
                      }
                    },
                    "next-tick": {
                      "version": "1.1.0",
                      "resolved": "https://registry.npmjs.org/next-tick/-/next-tick-1.1.0.tgz",
                      "overridden": false
                    }
                  }
                },
                "type": {
                  "version": "2.7.3",
                  "resolved": "https://registry.npmjs.org/type/-/type-2.7.3.tgz",
                  "overridden": false
                }
              }
            },
            "es5-ext": {
              "version": "0.10.53"
            },
            "es6-symbol": {
              "version": "3.1.4"
            }
          }
        },
        "es6-symbol": {
          "version": "3.1.4",
          "resolved": "https://registry.npmjs.org/es6-symbol/-/es6-symbol-3.1.4.tgz",
          "overridden": false,
          "dependencies": {
            "d": {
              "version": "1.0.2"
            },
            "ext": {
              "version": "1.7.0",
              "resolved": "https://registry.npmjs.org/ext/-/ext-1.7.0.tgz",
              "overridden": false,
              "dependencies": {
                "type": {
                  "version": "2.7.3"
                }
              }
            }
          }
        },
        "next-tick": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/next-tick/-/next-tick-1.0.0.tgz",
          "overridden": false
        }
      }
    }
  }
}
`

function flattenDependencies(tree) {
  const result = {
    ".": {
      dependencies: []
    }
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

const tree = JSON.parse(treeString);

//  console.log(JSON.stringify(flattenDependencies(tree)));

const h = hoist(toTree(flattenDependencies(tree)), {check: true})

const d = h.dependencies
// console.log(d);
d.forEach((dep) => {
        console.log(dep.name,dep.references );
        if (dep.dependencies.size > 0) {
                dep.dependencies.forEach((dep) => {
                        console.log(`  ${dep.name}, ${dep.references}`);
                });
        }
})
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