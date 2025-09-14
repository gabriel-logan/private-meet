import { WebSocketGateway } from "@nestjs/websockets";

import { CreateChatDto } from "./dto/create-chat.dto";
import { UpdateChatDto } from "./dto/update-chat.dto";

@WebSocketGateway()
export class ChatGateway {}
