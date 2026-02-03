import { initReactI18next } from "react-i18next";
import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { beforeAll, describe, expect, it } from "vitest";

import { resources } from "../utils/i18n";
import Loading from "./Loading";

describe("Loading", () => {
  beforeAll(() => {
    i18next.use(initReactI18next).init({
      lng: "en",
      resources: {
        en: resources.en,
      },
    });
  });

  it("renders loading component", () => {
    render(<Loading />);

    expect(screen.getByText("Loading...")).toBeDefined();
  });
});
