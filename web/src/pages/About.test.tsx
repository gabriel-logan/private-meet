import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AboutPage from "./About";

describe("AboutPage", () => {
  it("should render properly", () => {
    render(<AboutPage />);

    expect(screen.getByText("Private Meet")).toBeDefined();
  });
});
