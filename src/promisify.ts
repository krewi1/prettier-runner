import { readFile, unlink, writeFile } from "fs";
import { promisify } from "util";
import { exec } from "child_process";

export const readFileAsync = promisify(readFile);
export const writeFileAsync = promisify(writeFile);
export const unlinkFileAsync = promisify(unlink);

export function execute(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout) => {
            if (error) {
                return reject(error);
            }
            resolve(stdout);
        });
    });
}

type NullablePromise<T> = Promise<T | null>;
type PromiseFunction<T, A extends any[]> = (...args: A) => NullablePromise<T>;

export function promiseSerial<T, A extends any[]>(funcs: PromiseFunction<T, A>[], ...args: A) {
    return funcs.reduce(
        (promise: Promise<(T | null)[]>, func) => promise.then(result => func(...args).then(resultSet => [...result, resultSet])),
        Promise.resolve([])
    );
}
