export interface PrettierRunConfig {
    projectRoot: string;
    prettierCfgPath: string;
}
export declare function setup(config: PrettierRunConfig): {
    runPrettier: () => Promise<void>;
};
