export interface PrettierRunConfig {
    projectRoot: string;
    prettierCfgPath: string;
    changedPaths?: string[];
}
export declare function setup(config: PrettierRunConfig): {
    runPrettier: () => Promise<void>;
};
