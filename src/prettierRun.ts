import { exec } from "child_process";
import { resolve } from "path";
import { format, resolveConfig, Options } from "prettier";
import { promisify } from "util";
import { readFile, writeFile } from "fs";

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

export interface PrettierRunConfig {
    projectRoot: string;
    prettierCfgPath: string;
    changedPaths?: string[];
}

export function setup(config: PrettierRunConfig) {
    function execute(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout) => {
                if (error) {
                    return reject(error);
                }
                resolve(stdout);
            });
        });
    }

    async function runPrettier() {
        try {
            const filesToChange = config.changedPaths || await getChangedFilesFromGit();
            const prettierConfig = await resolveConfig(config.prettierCfgPath);
            if (prettierConfig) {
                const prettierLove = withPrettierOptions(prettierConfig);
                await Promise.all(filesToChange.map(prettierLove));
            } else {
                console.log("Invalid prettier config path.");
            }
        } catch (err) {
            console.log(err);
        }
    }

    async function getChangedFilesFromGit() {
        const changed: string = await execute("git diff --name-only");
        const changedFiles: string[] = changed.split("\n").map(toFullPath);
        return changedFiles.filter(isTs);
    }

    function toFullPath(file: string) {
        return resolve(config.projectRoot, file);
    }

    function withPrettierOptions(options: Options) {
        return async (file: string) => {
            const content = await readFileAsync(file, "utf8");
            const formatted = format(content, options);
            return writeFileAsync(file, formatted);
        };
    }

    function isTs(file: string) {
        return file.endsWith(".ts");
    }

    return {
        runPrettier
    };
}
