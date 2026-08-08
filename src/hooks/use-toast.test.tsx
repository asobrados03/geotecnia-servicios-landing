import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reducer, toast, useToast } from "./use-toast";

describe("toast reducer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("adds only the newest toast", () => {
    const state = reducer(
      { toasts: [{ id: "1", title: "First", open: true }] },
      { type: "ADD_TOAST", toast: { id: "2", title: "Second", open: true } }
    );

    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].id).toBe("2");
  });

  it("updates, dismisses, and removes toasts", () => {
    const initial = { toasts: [{ id: "1", title: "First", open: true }] };

    const updated = reducer(initial, {
      type: "UPDATE_TOAST",
      toast: { id: "1", title: "Updated" },
    });
    expect(updated.toasts[0].title).toBe("Updated");

    const dismissed = reducer(updated, { type: "DISMISS_TOAST", toastId: "1" });
    expect(dismissed.toasts[0].open).toBe(false);

    const removed = reducer(dismissed, { type: "REMOVE_TOAST", toastId: "1" });
    expect(removed.toasts).toEqual([]);
  });

  it("dismisses and removes all toasts when no id is provided", () => {
    const state = { toasts: [{ id: "1", open: true }, { id: "2", open: true }] };

    const dismissed = reducer(state, { type: "DISMISS_TOAST" });
    expect(dismissed.toasts.every((item) => item.open === false)).toBe(true);

    const removed = reducer(dismissed, { type: "REMOVE_TOAST" });
    expect(removed.toasts).toEqual([]);
  });
});

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reducer({ toasts: [] }, { type: "REMOVE_TOAST" });
  });

  it("publishes toast state to hook listeners", () => {
    const { result, unmount } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Solicitud enviada" });
    });

    expect(result.current.toasts[0]).toEqual(
      expect.objectContaining({
        title: "Solicitud enviada",
        open: true,
      })
    );

    unmount();
  });

  it("supports returned update and dismiss helpers", () => {
    const { result } = renderHook(() => useToast());
    let controls: ReturnType<typeof toast>;

    act(() => {
      controls = toast({ title: "Initial" });
      controls.update({ id: controls.id, title: "Changed" });
    });
    expect(result.current.toasts[0].title).toBe("Changed");

    act(() => {
      controls.dismiss();
    });
    expect(result.current.toasts[0].open).toBe(false);
  });

  it("dismisses when a toast open state changes to false", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "Closable" });
    });
    const onOpenChange = result.current.toasts[0].onOpenChange;

    act(() => {
      onOpenChange?.(false);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });
});
