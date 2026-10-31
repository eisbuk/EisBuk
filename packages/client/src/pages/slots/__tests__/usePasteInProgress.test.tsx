/**
 * @vitest-environment jsdom
 */

import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { PASTE_COOLDOWN_MS } from "@/store/actions/copyPaste";

import { usePasteInProgress } from "../usePasteInProgress";

const Harness: React.FC<{ slots: unknown }> = ({ slots }) => {
  const [inProgress, setInProgress] = usePasteInProgress(slots);
  return (
    <button onClick={() => setInProgress(true)}>
      {inProgress ? "pasting" : "idle"}
    </button>
  );
};

const startPaste = () => fireEvent.click(screen.getByRole("button"));

describe("usePasteInProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test("should end the paste when the slots change", () => {
    const { rerender } = render(<Harness slots={{ a: 1 }} />);
    startPaste();
    screen.getByText("pasting");
    rerender(<Harness slots={{ a: 2 }} />);
    screen.getByText("idle");
  });

  test("should end the paste after the timeout if the slots never change", () => {
    render(<Harness slots={{ a: 1 }} />);
    startPaste();
    act(() => {
      vi.advanceTimersByTime(PASTE_COOLDOWN_MS - 1);
    });
    expect(screen.getByRole("button").textContent).toEqual("pasting");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("button").textContent).toEqual("idle");
  });
});
