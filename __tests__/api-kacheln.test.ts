// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
import { revalidateTag } from "next/cache";
import { GET, POST } from "@/app/api/kacheln/route";
import { ladeKiNews } from "@/lib/kacheln/ki-news/laden";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/kacheln/ki-news/laden", () => ({ ladeKiNews: vi.fn() }));

beforeEach(() => {
  vi.mocked(revalidateTag).mockReset();
  vi.mocked(ladeKiNews).mockReset();
  vi.mocked(ladeKiNews).mockResolvedValue([]);
});

test("liefert die Kacheln und verbietet das Zwischenspeichern", async () => {
  const antwort = await GET();

  expect(antwort.status).toBe(200);
  expect(antwort.headers.get("Cache-Control")).toBe("no-store");
  const daten = await antwort.json();
  expect(daten.kacheln).toHaveLength(1);
  expect(daten.kacheln[0].status).toBe("ok");
});

test("eine fehlerhafte Kachel ändert den Status der Antwort nicht", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(ladeKiNews).mockRejectedValue(new Error("Testfehler"));

  const antwort = await GET();

  expect(antwort.status).toBe(200);
  const daten = await antwort.json();
  expect(daten.kacheln[0].status).toBe("fehler");
});

test("POST mit frisch leert den Speicher der Kachel vor dem Laden", async () => {
  vi.mocked(ladeKiNews).mockImplementation(async () => {
    expect(revalidateTag).toHaveBeenCalledWith("ki-news", { expire: 0 });
    return [];
  });

  const antwort = await POST(
    new Request("http://localhost/api/kacheln?frisch=ki-news", {
      method: "POST",
    }),
  );

  expect(antwort.status).toBe(200);
  expect(antwort.headers.get("Cache-Control")).toBe("no-store");
  const daten = await antwort.json();
  expect(daten.kacheln[0].status).toBe("ok");
  expect(ladeKiNews).toHaveBeenCalledTimes(1);
  expect(ladeKiNews).toHaveBeenCalledWith(
    expect.anything(),
    expect.any(Date),
    "ki-news",
  );
});

test.each(["", "?frisch=unbekannt"])(
  "POST ohne bekannte Kachel (%s) leert nichts und meldet 400",
  async (suche) => {
    const antwort = await POST(
      new Request(`http://localhost/api/kacheln${suche}`, { method: "POST" }),
    );

    expect(antwort.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(ladeKiNews).not.toHaveBeenCalled();
  },
);
