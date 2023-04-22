import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as rrd from "react-router-dom";

// Use real SVGs to be as close to production as possible
import { Calendar } from "@eisbuk/svg";

import AdminBar from "../AdminBar";
import { LinkItem } from "../Layout";

const Router = rrd.MemoryRouter;

describe("AdminBar", () => {
  test("should disable (and paint as active) the Link component if 'to' and current pathname matched", () => {
    const adminLinks: LinkItem[] = [
      {
        Icon: Calendar,
        label: "button-1",
        slug: "/test-slug",
      },
      {
        Icon: Calendar,
        label: "button-2",
        slug: "/different-slug",
      },
    ];

    render(
      <Router initialEntries={[{ pathname: "/test-slug" }]}>
        <AdminBar adminLinks={adminLinks} />
      </Router>
    );

    const [activeButton, otherButton] = screen.getAllByRole("button");

    // First button should be active (and disabled)
    expect(activeButton).toHaveProperty("disabled", true);
    expect(otherButton).not.toHaveProperty("disabled", true);
  });
});
