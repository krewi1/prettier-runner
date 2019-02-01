import {exec} from "child_process";
import {resolve} from "path";
import {check, format, resolveConfig, Options} from "prettier";
import {promisify} from "util";
import {readFile, writeFile} from "fs";
import {Linter, Configuration} from "tslint";

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

export interface PrettierRunConfig {
    projectRoot: string;
    prettierCfgPath: string;
    tslintCfgPath: string;
    changedPaths?: string[];
}

export interface PrettierRunner {
    runPipe: () => void;
}

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

interface FormatterFactory<T = {}> {
    (options: T): IFormatter
}

interface IFormatter {
    fix: () => Promise<IResultSet>;
    check: () => Promise<IResultSet>;
    configure: () => void;
}

interface FormatterData {
    fileType: RegExp,
    configFile: string,
    formatter: IFormatter
}

interface IResultSet {
    problems: string;
}

interface IFormattingFunction {
    (): Promise<IResultSet>
}

const promiseSerial = (funcs: IFormattingFunction[]) =>
    funcs.reduce((promise: Promise<IResultSet[]>, func: IFormattingFunction) =>
            promise.then(result => func().then((resultSet) => [...result, resultSet])),
        Promise.resolve([]));

export function setup(config: PrettierRunConfig): PrettierRunner {
    const formatter = {
        runPipe,
        registerFormatter
    };

    const formatters: FormatterData[] = [];

    function registerFormatter(formatter: FormatterData) {
        formatters.push(formatter);
    }

    async function runPipe() {
        try {
            const filesToChange = config.changedPaths || await getChangedFilesFromGit();
            const formatterPromises = formatters.map(({formatter}) => formatter.fix());
            const resultSets = promiseSerial(formatterPromises)
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

    async function prettierCheck() {
        try {
            const filesToChange = config.changedPaths || await getChangedFilesFromGit();
            const prettierConfig = await resolveConfig(config.prettierCfgPath);
            if (prettierConfig) {
                const contents = await Promise.all(filesToChange.map((file: string) => readFileAsync(file, "utf8")));
                return contents.every((content: string) => check(content, prettierConfig))
            }
        } catch (err) {
            throw new Error("Invalid cfg path");
        }
        throw new Error("Something bad happeds");
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

    return formatter;
}
