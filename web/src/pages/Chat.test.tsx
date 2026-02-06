import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ChatPage from "./Chat";

describe("ChatPage", () => {
  it("should render properly", () => {
    render(<ChatPage />);

    expect(screen.getByText("Chat")).toBeDefined();
  });
});
