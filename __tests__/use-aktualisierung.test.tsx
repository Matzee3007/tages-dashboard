import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useAktualisierung } from "@/lib/kacheln/use-aktualisierung";

let sichtbarkeit: DocumentVisibilityState;

function wechsleZu(neu: DocumentVisibilityState) {
  sichtbarkeit = neu;
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  vi.useFakeTimers();
  sichtbarkeit = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(
    () => sichtbarkeit,
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("ruft beim Start und danach jede Minute ab", () => {
  const abrufen = vi.fn();
  renderHook(() => useAktualisierung(abrufen));
  expect(abrufen).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(60_000);
  expect(abrufen).toHaveBeenCalledTimes(2);
});

test("ruft verborgen nicht ab", () => {
  const abrufen = vi.fn();
  renderHook(() => useAktualisierung(abrufen));

  wechsleZu("hidden");
  vi.advanceTimersByTime(180_000);
  expect(abrufen).toHaveBeenCalledTimes(1);
});

test("ruft nach über einer Minute im Verborgenen sofort ab", () => {
  const abrufen = vi.fn();
  renderHook(() => useAktualisierung(abrufen));

  wechsleZu("hidden");
  vi.advanceTimersByTime(300_000);
  wechsleZu("visible");
  expect(abrufen).toHaveBeenCalledTimes(2);
});

test("ruft nach kurzem Verbergen nicht zusätzlich ab", () => {
  const abrufen = vi.fn();
  renderHook(() => useAktualisierung(abrufen));

  wechsleZu("hidden");
  vi.advanceTimersByTime(10_000);
  wechsleZu("visible");
  expect(abrufen).toHaveBeenCalledTimes(1);
});

test("ruft nach dem Entfernen nicht mehr ab", () => {
  const abrufen = vi.fn();
  const { unmount } = renderHook(() => useAktualisierung(abrufen));

  unmount();
  vi.advanceTimersByTime(180_000);
  wechsleZu("hidden");
  wechsleZu("visible");
  expect(abrufen).toHaveBeenCalledTimes(1);
});

test("nutzt nach einem neuen Rendern die neue Funktion, ohne den Takt neu zu starten", () => {
  const erste = vi.fn();
  const zweite = vi.fn();
  const { rerender } = renderHook(({ f }) => useAktualisierung(f), {
    initialProps: { f: erste },
  });

  vi.advanceTimersByTime(30_000);
  rerender({ f: zweite });
  expect(zweite).not.toHaveBeenCalled();

  vi.advanceTimersByTime(30_000);
  expect(zweite).toHaveBeenCalledTimes(1);
});
