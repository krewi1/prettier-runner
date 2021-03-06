import { createSandbox, SinonSandbox, SinonStub, assert } from "sinon";
import "mocha";
import { expect, assert as assertion } from "chai";
import * as process from "child_process";
import { promisify } from "util";
import { join } from "path";
import { readFile, writeFile, unlink } from "fs";

assert.expose(assertion, { prefix: "" });

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const unlinkFileAsync = promisify(unlink);
import { setup } from "../src/prettierRun";

const dirname: string = __dirname;
const packageJsonPath: string = join(dirname, "package.json");
const jsName: string = "test.ts";
const jsPath: string = join(dirname, jsName);

describe("Prettier runner", () => {
    let sandBox: SinonSandbox;
    let exec: SinonStub;

    beforeEach(async () => {
        await writeFileAsync(
            packageJsonPath,
            `{
            "printWidth": 140,
            "tabWidth": 4,
            "parser": "typescript"
        }`
        );
        sandBox = createSandbox();
        exec = sandBox.stub(process, "exec");

        await writeFileAsync(
            jsPath,
            `import {a} from "a";

function f() {
    return a
}`
        );
    });

    describe("initialization", () => {
        it("runner is initialized and return its interface", async () => {
            const iface = setup({
                prettierCfgPath: packageJsonPath,
                projectRoot: __dirname
            });

            expect(iface).to.haveOwnProperty("runPrettier");
        });
    });

    describe("files are provided from external source", () => {
        it("then format them", async () => {
            // given
            exec.yields(undefined, jsName);
            const iface = setup({
                prettierCfgPath: packageJsonPath,
                projectRoot: __dirname,
                changedPaths: ["test/test.ts"]
            });

            // when
            await iface.runPrettier();

            // then
            const result = await readFileAsync(jsPath);
            expect(result.toString()).to.equal(`import { a } from "a";

function f() {
    return a;
}
`);
        });
    });

    describe("files are returned by git", () => {
        it("then format them", async () => {
            // given
            exec.yields(undefined, jsName);
            const iface = setup({
                prettierCfgPath: packageJsonPath,
                projectRoot: __dirname
            });

            // when
            await iface.runPrettier();

            // then
            const result = await readFileAsync(jsPath);
            expect(result.toString()).to.equal(`import { a } from "a";

function f() {
    return a;
}
`);
        });
    });

    afterEach(async () => {
        sandBox.restore();
        await unlinkFileAsync(jsPath);
        await unlinkFileAsync(packageJsonPath);
    });
});
