export interface EnvGlobalConfig {
  readonly server: {
    readonly nodeEnv: "development" | "production" | "test";
    readonly port: number;
    readonly jwt: {
      readonly secret: string;
      readonly expiration: string;
    };
  };
}

export type EnvTestConfig = EnvGlobalConfig;
