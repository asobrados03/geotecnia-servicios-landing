import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App routing", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("renders the home route", () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /servicios geotécnicos profesionales para obras seguras/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the catch-all 404 route and logs the missed path", async () => {
    window.history.pushState({}, "", "/ruta-inexistente");

    render(<App />);

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "404 Error: User attempted to access non-existent route:",
        "/ruta-inexistente"
      );
    });
  });
});
