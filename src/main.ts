import {NpmNodeModulesCollector} from "./npmNodeModulesCollector"
import {PnpmNodeModulesCollector} from "./pnpmNodeModulesCollector"


let collector = new NpmNodeModulesCollector("./tests/tar-demo");
let result = collector.getNodeModules()
console.log(JSON.stringify(result, null, 2));

collector = new PnpmNodeModulesCollector("./tests/es5-demo");
result = collector.getNodeModules()
console.log(JSON.stringify(result, null, 2));