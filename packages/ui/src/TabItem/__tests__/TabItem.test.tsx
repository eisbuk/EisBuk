import React from "react";
import { render, screen } from "@testing-library/react";

import { Calendar } from "@eisbuk/svg";

import TabItem from "../TabItem";

test("TabItem should fire custom onClick handler", () => {
  const mockOnClick = jest.fn();

  const buttonLabel = "Calendar";

  render(<TabItem onClick={mockOnClick} label={buttonLabel} Icon={Calendar} />);

  screen.getByText(buttonLabel).click();

  expect(mockOnClick).toHaveBeenCalled();
});
