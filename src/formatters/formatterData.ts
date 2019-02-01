export interface IFormatter {
    check: (filePath: string) => Promise<IResult|null>;
    fix: (filePath: string) => Promise<IResult|null>;
}

export interface IResult {

}