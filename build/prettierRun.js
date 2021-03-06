"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = require("path");
const prettier_1 = require("prettier");
const util_1 = require("util");
const fs_1 = require("fs");
const readFileAsync = util_1.promisify(fs_1.readFile);
const writeFileAsync = util_1.promisify(fs_1.writeFile);
function setup(config) {
    function execute(command) {
        return new Promise((resolve, reject) => {
            child_process_1.exec(command, (error, stdout) => {
                if (error) {
                    return reject(error);
                }
                resolve(stdout);
            });
        });
    }
    function runPrettier() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filesToChange = config.changedPaths || (yield getChangedFilesFromGit());
                const prettierConfig = yield prettier_1.resolveConfig(config.prettierCfgPath);
                if (prettierConfig) {
                    const prettierLove = withPrettierOptions(prettierConfig);
                    yield Promise.all(filesToChange.map(prettierLove));
                }
                else {
                    console.log("Invalid prettier config path.");
                }
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    function getChangedFilesFromGit() {
        return __awaiter(this, void 0, void 0, function* () {
            const changed = yield execute("git diff --name-only");
            const changedFiles = changed.split("\n").map(toFullPath);
            return changedFiles.filter(isTs);
        });
    }
    function toFullPath(file) {
        return path_1.resolve(config.projectRoot, file);
    }
    function withPrettierOptions(options) {
        return (file) => __awaiter(this, void 0, void 0, function* () {
            const content = yield readFileAsync(file, "utf8");
            const formatted = prettier_1.format(content, options);
            return writeFileAsync(file, formatted);
        });
    }
    function isTs(file) {
        return file.endsWith(".ts");
    }
    return {
        runPrettier
    };
}
exports.setup = setup;