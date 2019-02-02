import {fromRuleFailureToResult, IFormatter} from "./formatterData";
import {readFileAsync} from "../promisify";
import {Configuration, Linter} from "tslint";
import {IConfigurationFile} from "tslint/lib/configuration";

interface TsLintData {
    tsLintCfgPath: string;
}

export async function TsLint(options: TsLintData): Promise<IFormatter> {
    const tsLintConfig = Configuration.findConfiguration(options.tsLintCfgPath).results;
    return {
        check: check(tsLintConfig!),
        fix: fix(tsLintConfig!)
    }
}

function check(options: IConfigurationFile){
    return async (file: string) => {
        const linterOptions = {
            fix: false,
            formatter: "json"
        };
        const linter = new Linter(linterOptions);
        const fileContent = await readFileAsync(file, "utf8");
        linter.lint(file, fileContent, options);
        const result = linter.getResult();
        const {fixes = [], failures} = result;
        return {
            failures: failures.map(fromRuleFailureToResult),
            autofixes: fixes.map(fromRuleFailureToResult)
        };
    }
}

function fix(options: IConfigurationFile){
    return async (file: string) => {
        const linterOptions = {
            fix: true,
            formatter: "json"
        };
        const linter = new Linter(linterOptions);
        const fileContent = await readFileAsync(file, "utf8");
        linter.lint(file, fileContent, options);
        const result = linter.getResult();
        const {fixes = [], failures} = result;
        return {
            failures: failures.map(fromRuleFailureToResult),
            autofixes: fixes.map(fromRuleFailureToResult)
        };
    }
}
