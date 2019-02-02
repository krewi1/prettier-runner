import {RuleFailure} from "tslint";

export interface IFormatter {
    check: (filePath: string) => Promise<IResult|null>;
    fix: (filePath: string) => Promise<IResult|null>;
}

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
    }
}
