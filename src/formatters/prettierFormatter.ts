import { IFormatter } from "./formatterData";
import { resolveConfig, Options as PrettierOptions, format, check as prettierCheck, getFileInfo } from "prettier";
import { readFileAsync, writeFileAsync } from "../promisify";

interface PrettierFormatterData {
    prettierCfgPath: string;
}

export async function Prettier(options: PrettierFormatterData): Promise<IFormatter> {
    const prettierConfig = await resolveConfig(options.prettierCfgPath);
    return {
        check: check(prettierConfig!),
        fix: fix(prettierConfig!)
    };
}

function check(options: PrettierOptions) {
    return async (file: string) => {
        const fileContent = await readFileAsync(file, "utf8");
        const formatted = prettierCheck(fileContent, options);
        writeFileAsync(file, formatted);
        return null;
    };
}

function fix(options: PrettierOptions) {
    return async (file: string) => {
        const fileContent = await readFileAsync(file, "utf8");
        const info = await getFileInfo(file);
        const formatted = format(fileContent, options);
        console.log(info);
        writeFileAsync(file, formatted);
        return null;
    };
}
