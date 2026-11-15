// Gibt nach ms auf und wirft. Der Vorgang selbst läuft weiter, nur niemand wartet mehr auf ihn.
export async function mitZeitlimit<T>(
  vorgang: Promise<T>,
  ms: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const zeitlimit = new Promise<never>((_, abbrechen) => {
    timer = setTimeout(
      () => abbrechen(new Error("Zeitlimit überschritten")),
      ms,
    );
  });
  try {
    return await Promise.race([vorgang, zeitlimit]);
  } finally {
    clearTimeout(timer);
  }
}
