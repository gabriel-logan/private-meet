import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./Home";

describe("HomePage", () => {
  it("should render properly", () => {
    render(<HomePage />);

    expect(screen.getByText("Private Meet")).toBeDefined();
  });
});
