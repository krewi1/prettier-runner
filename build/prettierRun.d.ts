export interface PrettierRunConfig {
    projectRoot: string;
    pretierCfgPath: string;
}
export declare function setup(config: PrettierRunConfig): {
    runPrettier: () => Promise<void>;
};
