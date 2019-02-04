import {resolve} from "path";
import {IFormatter, IResult, NullableResults} from "./formatters/formatterData";
import {execute, promiseSerial} from "./promisify";


export interface FormatterRunnerConfig<T extends boolean> {
    resolveChangeFiles: T
    projectRoot?: T extends false ? string : never;
    changedFiles?: T extends false ? string[] : never;
}

export interface PrettierRunner {
    registerFormatter: (formatter: FormatterData) => void,
    runFixPipe: () => void;
    runCheckPipe: () => void;
}

interface FormatterData {
    fileType?: RegExp,
    formatter: IFormatter
}

export function setup<T extends boolean>(config: FormatterRunnerConfig<T>): PrettierRunner {
    const formatters: FormatterData[] = [];

    function registerFormatter(formatter: FormatterData) {
        formatters.push(formatter);
    }

    async function runFixPipe() {
        try {
            const filesToChange = config.resolveChangeFiles ?  await getChangedFilesFromGit() : config.changedFiles;
            const formatterPromises = formatters.map(({formatter, fileType = ""}) => ({fnc: formatter.fix, fileType: fileType || ""}));
            const results: NullableResults[] = await filesToChange!.map((file: string) => promiseSerial(formatterPromises.filter((formatter) => file.match(formatter.fileType)).map((formatter) => formatter.fnc), file));
            return await results.reduce(toFinalResult, Promise.resolve({autofixes: [], failures: []}));
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    async function runCheckPipe() {
        try {
            const filesToChange = config.resolveChangeFiles ?  await getChangedFilesFromGit() : config.changedFiles;
            const formatterPromises = formatters.map(({formatter, fileType = ""}) => ({fnc: formatter.check, fileType: fileType || ""}));
            const results: NullableResults[] = await filesToChange!.map((file: string) => promiseSerial(formatterPromises.filter((formatter) => file.match(formatter.fileType)).map((formatter) => formatter.fnc), file));
            return await results.reduce(toFinalResult, Promise.resolve({autofixes: [], failures: []}));
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    async function getChangedFilesFromGit() {
        const changed: string = await execute("git diff --name-only");
        return changed.split("\n").map(toFullPath);
    }

    function toFullPath(file: string) {
        return resolve(config.projectRoot || "", file);
    }

    async function toFinalResult(finalResult: Promise<IResult>, formattersResults: NullableResults) {
        const reducedResults = await formattersResults.then((formatterResult) => formatterResult.filter(notNull));
        const reducedResult = reducedResults.reduce(((previousValue, currentValue) => ({autofixes: [...previousValue.autofixes, ...currentValue.autofixes], failures: [...previousValue.failures, ...currentValue.failures]})), {autofixes: [], failures: []});
        let result = await finalResult;
        result = {
            autofixes: [...result.autofixes, ...reducedResult.autofixes],
            failures: [...result.failures, ...reducedResult.failures],
        };
        return result;
    }

    function notNull<TValue>(value: TValue|null): value is TValue {
        return value !== null;
    }

    return {
        runFixPipe,
        runCheckPipe,
        registerFormatter
    }
}

