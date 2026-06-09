import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRowSelection } from "@/hooks/useRowSelection";

describe("useRowSelection", () => {
  it("toggles a single row on and off", () => {
    const { result } = renderHook(() => useRowSelection());
    expect(result.current.count).toBe(0);

    act(() => result.current.toggle("a"));
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.count).toBe(1);

    act(() => result.current.toggle("a"));
    expect(result.current.isSelected("a")).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it("select-all toggles every visible id, then clears when all selected", () => {
    const { result } = renderHook(() => useRowSelection());
    const ids = ["a", "b", "c"];

    act(() => result.current.toggleAll(ids));
    expect(result.current.count).toBe(3);
    expect(result.current.allSelected(ids)).toBe(true);
    expect(result.current.someSelected(ids)).toBe(false);

    act(() => result.current.toggleAll(ids)); // all on → clears
    expect(result.current.count).toBe(0);
  });

  it("reports a partial selection via someSelected", () => {
    const { result } = renderHook(() => useRowSelection());
    act(() => result.current.toggle("a"));
    expect(result.current.someSelected(["a", "b"])).toBe(true);
    expect(result.current.allSelected(["a", "b"])).toBe(false);

    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });
});
