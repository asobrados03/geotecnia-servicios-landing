import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  it("returns true below the mobile breakpoint", () => {
    vi.stubGlobal("innerWidth", 767);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("returns false at desktop widths", () => {
    vi.stubGlobal("innerWidth", 1024);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});
