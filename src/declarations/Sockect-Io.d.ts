import type { JwtPayload } from "src/common/types";

declare module "socket.io" {
  interface Socket {
    user?: JwtPayload;
  }
}
