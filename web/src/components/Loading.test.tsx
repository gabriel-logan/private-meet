import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Loading from "./Loading";

describe("Loading", () => {
  it("renders loading component", () => {
    render(<Loading />);

    expect(screen.getByText("Loading...")).toBeDefined();
  });
});
