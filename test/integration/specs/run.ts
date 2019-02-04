import {setup} from "../../../src/formatterRunner";
import {join, resolve} from "path";
import {unlinkFileAsync, writeFileAsync} from "../../../src/promisify";
import {TsLint} from "../../../src/formatters/typescriptFormatter";
import {Prettier} from "../../../src/formatters/prettierFormatter";
import {expect} from "chai";

const dirname: string = __dirname;
const packageJsonPath: string = join(dirname, "package.json");
const tsLintFile: string = join(dirname, "tslint.json");
const tsConfigFile: string = join(dirname, "tsConfig.json");
const jsPath1: string = join(dirname, "test1.ts");
const jsPath2: string = join(dirname, "test2.ts");

// how to solve it better way - using function for implicit this binding
describe("use of formatter runner", function() {
    this.timeout(10000);
    beforeEach(async () => {
        // @ts-ignore
        this.timeout(10000);
        await writeFileAsync(
            packageJsonPath,
            `{
            "printWidth": 140,
            "tabWidth": 4,
            "parser": "typescript"
        }`
        );

        await writeFileAsync(
            jsPath1,
            `import {a} from "a";

export function f() {
    console.log("cc");
}`
        );

        await writeFileAsync(
            jsPath2,
            `import {a} from "a";
import {format, check, something as blah} from "prettier";
import {f} from "./test1";

function log(): void {
    console.log("a")
}
`
        );
    });

    it("can fix source codes", async () => {
        // @ts-ignore
        const runner = setup({
            resolveChangeFiles: false,
            changedFiles: [
                jsPath1,
                jsPath2
            ]
        });
        runner.registerFormatter({
            formatter: await TsLint({
                projectRoot: resolve(dirname, "..", "..", ".."),
                tsLintPath: tsLintFile,
                tsConfigPath: tsConfigFile
            })
        });
        runner.registerFormatter({
            formatter: await Prettier({
                prettierCfgPath: packageJsonPath
            })
        });

        const results = await runner.runFixPipe();
        expect(results).to.eql({
            autofixes: [
                {
                    description: "file should end with a newline",
                    file: "D:/projects/prettier-runner/test/integration/specs/test1.ts",
                    pointer: {
                        line: 4,
                        character: 1
                    }
                },
                {
                    description: "All imports on this line are unused.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test1.ts",
                    pointer: {
                        line: 0,
                        character: 0
                    }
                },
                {
                    description: "Named imports must be alphabetized.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test2.ts",
                    pointer: {
                        "line": 1,
                        "character": 8
                    }
                },
                {
                    description: "All imports on this line are unused.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test2.ts",
                    pointer: {
                        line: 0,
                        character: 0
                    }
                },
                {
                    description: "All imports on this line are unused.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test2.ts",
                    pointer: {
                        line: 1,
                        character: 0
                    }
                },
                {
                    description: "All imports on this line are unused.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test2.ts",
                    pointer: {
                        line: 2,
                        character: 0
                    }
                }
            ],
            failures: [
                {
                    description: "expected call-signature: 'f' to have a typedef",
                    file: "D:/projects/prettier-runner/test/integration/specs/test1.ts",
                    pointer: {
                        "line": 1,
                        "character": 16
                    }
                }
            ]
        });
    });

    it("can check source codes in check mode", async () => {
        const runner = setup({
            resolveChangeFiles: false,
            changedFiles: [
                jsPath1,
                jsPath2
            ]
        });
        runner.registerFormatter({
            formatter: await TsLint({
                projectRoot: resolve(dirname, "..", "..", ".."),
                tsLintPath: tsLintFile,
                tsConfigPath: tsConfigFile
            })
        });
        runner.registerFormatter({
            formatter: await Prettier({
                prettierCfgPath: packageJsonPath
            })
        });

        const results = await runner.runCheckPipe();
        expect(results).to.eql({
            autofixes: [],
            failures: [
                {
                    description: "file should end with a newline",
                    file: "D:/projects/prettier-runner/test/integration/specs/test1.ts",
                    pointer: {
                        line: 4,
                        character: 1
                    }
                },
                {
                    description: "All imports on this line are unused.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test1.ts",
                    pointer: {
                        line: 0,
                        character: 0
                    }
                },
                {
                    description: "expected call-signature: 'f' to have a typedef",
                    file: "D:/projects/prettier-runner/test/integration/specs/test1.ts",
                    pointer: {
                        "line": 2,
                        "character": 16
                    }
                },
                {
                    description: "Named imports must be alphabetized.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test2.ts",
                    pointer: {
                        "line": 1,
                        "character": 8
                    }
                },
                {
                    description: "'log' is declared but its value is never read.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test2.ts",
                    pointer: {
                        "line": 4,
                        "character": 9
                    }
                },
                {
                    description: "All imports on this line are unused.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test2.ts",
                    pointer: {
                        line: 0,
                        character: 0
                    }
                },
                {
                    description: "All imports on this line are unused.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test2.ts",
                    pointer: {
                        line: 1,
                        character: 0
                    }
                },
                {
                    description: "All imports on this line are unused.",
                    file: "D:/projects/prettier-runner/test/integration/specs/test2.ts",
                    pointer: {
                        line: 2,
                        character: 0
                    }
                }
            ]
        });
    });

    afterEach(async () => {
        await unlinkFileAsync(jsPath1);
        await unlinkFileAsync(jsPath2);
        await unlinkFileAsync(packageJsonPath);
    })
});