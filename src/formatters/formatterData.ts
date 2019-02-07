import { RuleFailure } from "tslint";

export interface IFormatter {
    check: FormattingFunction;
    fix: FormattingFunction;
}

export interface FormattingFunction {
    (filePath: string): Promise<NullableResult>;
}

export type NullableResult = IResult | null;

export type NullableResults = Promise<NullableResult[]>;

export interface IResult {
    failures: IResultPointer[];
    autofixes: IResultPointer[];
}

export interface IResultPointer {
    description: string;
    file: string;
    pointer: IPointer;
}

export interface IPointer {
    line: number;
    character: number;
}

export function fromRuleFailureToResult(ruleFailure: RuleFailure): IResultPointer {
    return {
        description: ruleFailure.getFailure(),
        file: ruleFailure.getFileName(),
        pointer: ruleFailure.getStartPosition().getLineAndCharacter()
    };
}
