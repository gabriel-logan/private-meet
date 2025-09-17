import type { EnvGlobalConfig } from "./types";

export default (): EnvGlobalConfig => {
  const nodeEnv = process.env.NODE_ENV;
  const port = process.env.SERVER_PORT;
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiration = process.env.JWT_EXPIRATION;

  if (!jwtSecret || !jwtExpiration) {
    throw new Error("Missing JWT configuration in environment variables");
  }

  if (!nodeEnv || !port) {
    throw new Error("Missing required environment variables");
  }

  return {
    server: {
      nodeEnv: nodeEnv as EnvGlobalConfig["server"]["nodeEnv"],
      port: parseInt(port, 10),
      jwt: {
        secret: jwtSecret,
        expiration: jwtExpiration,
      },
    },
  };
};
