import { fromRuleFailureToResult, IFormatter } from "./formatterData";
import { Configuration, Linter } from "tslint";
import { Program } from "typescript";
import { IConfigurationFile } from "tslint/lib/configuration";

interface TsLintData {
    tsLintPath: string;
    tsConfigPath: string;
    projectRoot: string;
}

export async function TsLint(options: TsLintData): Promise<IFormatter> {
    const program = Linter.createProgram(options.tsConfigPath, options.projectRoot);
    const tsLintConfig = Configuration.findConfiguration(options.tsLintPath).results;
    return {
        check: check(tsLintConfig!, program),
        fix: fix(tsLintConfig!, program)
    };
}

function check(options: IConfigurationFile, program: Program) {
    return async (file: string) => {
        return await lint(options, program, file, false);
    };
}

function fix(options: IConfigurationFile, program: Program) {
    return async (file: string) => {
        return /*null*/ await lint(options, program, file, true);
    };
}

async function lint(options: IConfigurationFile, program: Program, file: string, fix: boolean) {
    const linterOptions = {
        fix,
        formatter: "json"
    };
    const linter = new Linter(linterOptions, program);
    const fileContent = program.getSourceFile(file)!.getFullText();
    linter.lint(file, fileContent, options);
    const result = linter.getResult();
    const { fixes = [], failures } = result;
    return {
        failures: failures.map(fromRuleFailureToResult),
        autofixes: fixes.map(fromRuleFailureToResult)
    };
}
