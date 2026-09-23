import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import PageError from "./error";

afterEach(cleanup);

it("offers accessible recovery without rendering exception details", () => {
  const reset = vi.fn();
  render(<PageError reset={reset} />);

  expect(
    screen.getByRole("heading", { name: "This page could not load." }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(reset).toHaveBeenCalledTimes(1);
});
