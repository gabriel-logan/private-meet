import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";

import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

describe("ChatGateway", () => {
  let gateway: ChatGateway;

  const mockChatService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, JwtModule],
      providers: [ChatGateway, ChatService],
    })
      .overrideProvider(ChatService)
      .useValue(mockChatService)
      .compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it("should be defined", () => {
    expect(gateway).toBeDefined();
  });
});
