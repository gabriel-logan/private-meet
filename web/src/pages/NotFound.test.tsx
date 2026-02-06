import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFoundPage from "./NotFound";

describe("NotFoundPage", () => {
  it("should render properly", () => {
    render(<NotFoundPage />);

    expect(screen.getByText("404 - Page Not Found")).toBeDefined();
  });
});
