export interface EnvGlobalConfig {
  readonly server: {
    readonly nodeEnv: "development" | "production" | "test";
    readonly port: number;
  };
}

export type EnvTestConfig = EnvGlobalConfig;
