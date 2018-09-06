# prettier-runner
## Prerequisites
* installed in repository which is using git
* prettier config

## How to use
```
import { setup } from "prettierrun/build/prettierRun";

setup({
    pretierCfgPath: "path/to/your/prettier/config,
    projectRoot: "root/of/project"
}).runPrettier();
```
## how it works?
Simply calls git diff for changed files and format them
