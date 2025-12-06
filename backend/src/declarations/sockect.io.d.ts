import type { JwtPayload } from "src/shared/types";

declare module "socket.io" {
  interface Socket {
    user?: JwtPayload;
  }
}
