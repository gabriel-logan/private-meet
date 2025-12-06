import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";

export type Io = (opts?: Partial<ManagerOptions & SocketOptions>) => Socket;
