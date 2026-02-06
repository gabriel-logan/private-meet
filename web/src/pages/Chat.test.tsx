import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ChatPage from "./Chat";

describe("ChatPage", () => {
  it("should render properly", () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Meeting Room")).toBeDefined();
  });
});
